import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { admin, fail, requireUser } from "../../server/http";
const schema=z.object({approvalId:z.string().uuid(),decision:z.enum(["approved","rejected"]),note:z.string().max(1000).optional()});
export default async function handler(req:VercelRequest,res:VercelResponse){ if(req.method!=="POST")return res.status(405).json({error:"METHOD_NOT_ALLOWED"}); try{const user=await requireUser(req),body=schema.parse(req.body),db=admin();
  const {data:approval}=await db.from("approvals").select("*,commands(id,restaurant_id,status)").eq("id",body.approvalId).eq("approver_id",user.id).single(); if(!approval)throw new Error("FORBIDDEN"); if(approval.status!=="pending")throw new Error("ALREADY_DECIDED");
  await db.from("approvals").update({status:body.decision,note:body.note,decided_at:new Date().toISOString()}).eq("id",body.approvalId);
  const commandId=(approval as any).commands.id; const {data:all}=await db.from("approvals").select("status").eq("command_id",commandId);
  const final=all?.some(a=>a.status==="rejected")?"rejected":all?.every(a=>a.status==="approved")?"approved":"pending_approval";
  if(final!=="pending_approval")await db.from("commands").update({status:final}).eq("id",commandId);
  await db.from("audit_events").insert({restaurant_id:(approval as any).commands.restaurant_id,command_id:commandId,actor_id:user.id,event:`approval_${body.decision}`,metadata:{note:body.note||null}});
  // Approved actions enter the execution queue; connectors execute out-of-band and idempotently.
  if(final==="approved")await db.from("execution_jobs").insert({command_id:commandId,status:"queued",idempotency_key:`command:${commandId}`});
  return res.json({status:final});
}catch(e){return fail(res,e)}}
