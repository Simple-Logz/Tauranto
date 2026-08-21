import type {VercelRequest,VercelResponse} from "@vercel/node";import {z} from "zod";import {admin,fail,requireUser} from "../../server/http";import {interpretWithAI,type Proposal} from "../../server/agent";import {notifyApprovers} from "../../server/notify";import {buildImpactPlan,exceedsRoleCeiling,extractAmount,requiredApprovals,spendLimitFor,validateProposal} from "../../server/operations";import {executeJob} from "../../server/executor";import {withinRateLimit} from "../../server/ratelimit";
const bodySchema=z.object({restaurantId:z.string().uuid(),transcript:z.string().min(2).max(4000),source:z.enum(["voice","typed"]).default("voice")});
// One transcript can decompose into several independent proposals (see
// server/agent.ts). Each one runs the full validate/plan/govern/approve-or-
// execute pipeline completely on its own — a compound instruction like
// "pause delivery, tell Sarah, move the meeting" can auto-execute one part
// while another part is still waiting on a manager's approval.
async function processProposal(db:any,body:{restaurantId:string;source:"voice"|"typed"},user:{id:string},membership:any,integrations:any[],policy:any,context:any,proposal:Proposal){
 const validation=validateProposal(proposal),impactPlan=buildImpactPlan(proposal,integrations);
 if(!impactPlan.length)validation.problems.push('No configured delivery channel can execute this action yet.');
 validation.valid=validation.problems.length===0;
 const needed=requiredApprovals(proposal.risk,policy);
 const roleExceeded=validation.valid&&exceedsRoleCeiling(proposal.risk,membership.role,policy);
 const amount=validation.valid?extractAmount(proposal.parameters):null;
 const spendLimit=validation.valid?spendLimitFor(membership.role,policy):null;
 const overSpendLimit=validation.valid&&amount!=null&&spendLimit!=null&&amount>spendLimit;
 const neededFinal=Math.max(needed,(roleExceeded||overSpendLimit)?1:0);
 const autoExecute=validation.valid&&neededFinal===0;
 const state=!validation.valid?"needs_clarification":autoExecute?"approved":"pending_approval";
 const approvedPlan=autoExecute?impactPlan:[];
 const {data:command,error}=await db.from("commands").insert({restaurant_id:body.restaurantId,created_by:user.id,source:body.source,transcript:(body as any).transcript,...proposal,intent:proposal.action_type,resolved_context:context,impact_plan:impactPlan,approved_plan:approvedPlan,validation,status:state}).select().single();
 if(error)throw error;
 for(const [stage,status,detail] of [["interpret","completed",{confidence:proposal.confidence,actionType:proposal.action_type}],["validate",validation.valid?"completed":"blocked",validation],["plan",impactPlan.length?"completed":"blocked",{actions:impactPlan}]])await db.from("operation_events").insert({restaurant_id:body.restaurantId,command_id:command.id,stage,status,detail});
 let execution:any[]=[];
 if(autoExecute){
  await db.from("operation_events").insert({restaurant_id:body.restaurantId,command_id:command.id,stage:"authorize",status:"approved",detail:{mode:"automatic",risk:proposal.risk}});
  const now=Date.now(),jobs=impactPlan.map((a:any,i:number)=>{const parsed=a.executeAt?Date.parse(a.executeAt):NaN,executeAt=Number.isFinite(parsed)&&parsed>now?new Date(parsed).toISOString():null;return{command_id:command.id,status:"queued",provider:a.provider,action_key:a.action,payload:a.payload||{},execute_at:executeAt,idempotency_key:`command:${command.id}:${a.provider}:${a.action}:${i}`}});
  const {data:created,error:jobError}=await db.from("execution_jobs").insert(jobs).select("*");
  if(jobError)throw jobError;
  await db.from("operation_events").insert({restaurant_id:body.restaurantId,command_id:command.id,stage:"execute",status:"queued",detail:{jobs:jobs.length,automatic:true}});
  for(const job of created||[]){
   if(job.execute_at){execution.push({id:job.id,provider:job.provider,status:"scheduled",executeAt:job.execute_at});continue}
   try{await db.from("execution_jobs").update({status:"executing",attempts:(job.attempts||0)+1}).eq("id",job.id);await executeJob(job);execution.push({id:job.id,provider:job.provider,status:"completed"})}
   catch(e){const message=e instanceof Error?e.message:"FAILED";await db.from("execution_jobs").update({status:"retrying",attempts:(job.attempts||0)+1,last_error:message,next_attempt_at:new Date(Date.now()+60000).toISOString()}).eq("id",job.id);await db.from("operation_events").insert({restaurant_id:body.restaurantId,command_id:command.id,job_id:job.id,stage:"execute",status:"retrying",detail:{error:message}});execution.push({id:job.id,provider:job.provider,status:"retrying",error:message})}
  }
 }else if(state==="pending_approval"){
  const {data:managers}=await db.from("restaurant_members").select("user_id,profiles(full_name,email)").eq("restaurant_id",body.restaurantId).eq("can_approve",true).eq("active",true);
  const selected=(managers||[]).slice(0,neededFinal),approvals=selected.map((m:any)=>({command_id:command.id,approver_id:m.user_id,status:"pending"}));
  if(approvals.length<neededFinal)throw new Error(`NEEDS_${neededFinal}_APPROVER`);
  const {data:created}=await db.from("approvals").insert(approvals).select("id,approver_id");
  await notifyApprovers(selected.map((m:any)=>m.profiles),command);
  (command as any).approvalId=created?.find((a:any)=>a.approver_id===user.id)?.id;
  await db.from("operation_events").insert({restaurant_id:body.restaurantId,command_id:command.id,stage:"authorize",status:"pending",detail:{requiredApprovals:neededFinal,roleExceeded,overSpendLimit,amount,spendLimit,requestedByRole:membership.role}});
 }
 await db.from("audit_events").insert({restaurant_id:body.restaurantId,command_id:command.id,actor_id:user.id,event:"command_created",metadata:{source:body.source,state,validation,impactPlan,execution,roleExceeded,overSpendLimit,amount,spendLimit,requestedByRole:membership.role}});
 const failed=execution.find(x=>x.status==='retrying');
 const scheduled=execution.filter(x=>x.status==='scheduled');
 const completed=execution.filter(x=>x.status==='completed');
 let spokenReply:string;
 if(state==="needs_clarification")spokenReply=proposal.confirmation_question||validation.problems[0]||"I need a bit more information before I can proceed.";
 else if(autoExecute&&failed)spokenReply=`I understood the instruction, but ${failed.provider} could not complete it: ${failed.error}.`;
 else if(autoExecute&&scheduled.length)spokenReply=`Done. I understood the instruction and scheduled ${scheduled.length} action${scheduled.length===1?'':'s'} for execution.`;
 else if(autoExecute)spokenReply=`Done. I executed and verified ${completed.length} action${completed.length===1?'':'s'}.`;
 else if(overSpendLimit)spokenReply=`Estimated amount is $${amount}. Your purchasing limit is $${spendLimit}. I've sent this for approval.`;
 else if(roleExceeded)spokenReply=`This is a ${proposal.risk}-risk action, which needs a manager's approval before I can proceed.`;
 else spokenReply=`I understood the instruction and prepared ${impactPlan.length} action${impactPlan.length===1?'':'s'}. It needs approval before I execute it.`;
 return {command:{...command,status:autoExecute&&!failed&&!scheduled.length?"completed":command.status},impactPlan,validation,execution,pipeline:{heard:true,interpreted:true,validated:validation.valid,planned:impactPlan.length>0,authorization:autoExecute?"automatic":state==="pending_approval"?"pending":"blocked",executed:completed.length,scheduled:scheduled.length,failed:failed?{provider:failed.provider,error:failed.error}:null},spokenReply};
}
export default async function handler(req:VercelRequest,res:VercelResponse){
 if(req.method!=="POST")return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
 try{
  const user=await requireUser(req);
  if(!(await withinRateLimit(`interpret:${user.id}`,30,600)))return res.status(429).json({error:"Too many commands in a short time. Please wait a few minutes and try again."});
  const body=bodySchema.parse(req.body),db=admin();
  const {data:membership}=await db.from("restaurant_members").select("role,restaurants(name,timezone)").eq("restaurant_id",body.restaurantId).eq("user_id",user.id).single();
  if(!membership)throw new Error("FORBIDDEN");
  const [{data:integrations},{data:policy},{data:vendors},{data:drivers},{data:services}]=await Promise.all([db.from("integrations").select("provider,status,display_name,config").eq("restaurant_id",body.restaurantId),db.from("operation_policies").select("*").eq("restaurant_id",body.restaurantId).maybeSingle(),db.from("vendors").select("id,name,contact_name,email,phone,category,notes").eq("restaurant_id",body.restaurantId).eq("active",true),db.from("drivers").select("id,name,company,email,phone,notes").eq("restaurant_id",body.restaurantId).eq("active",true),db.from("service_providers").select("id,name,contact_name,email,phone,category,notes").eq("restaurant_id",body.restaurantId).eq("active",true)]);
  const context={restaurant:membership.restaurants,role:membership.role,connectedSystems:(integrations||[]).filter((i:any)=>i.status==='connected').map((i:any)=>i.provider),directory:{vendors:vendors||[],drivers:drivers||[],serviceProviders:services||[]},now:new Date().toISOString()};
  const proposals=await interpretWithAI(body.transcript,JSON.stringify(context));
  // Sequential, not parallel: keeps approver selection for one action from
  // racing another action in the same compound transcript, and transcripts
  // with more than one genuine instruction are the rare case (capped at 5).
  const results:Awaited<ReturnType<typeof processProposal>>[]=[];
  for(const proposal of proposals)results.push(await processProposal(db,body,user,membership,integrations||[],policy,context,proposal));
  const spokenReply=results.length===1?results[0]!.spokenReply:results.map(r=>r.spokenReply).join(" Also, ");
  return res.status(201).json({commands:results.map(r=>r.command),results,spokenReply});
 }catch(e){return fail(res,e)}
}
