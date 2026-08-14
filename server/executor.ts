import { Resend } from "resend";
import { admin } from "./http";

export async function executeJob(job:any){const db=admin();const {data:command}=await db.from("commands").select("*,restaurants(name)").eq("id",job.command_id).single();if(!command||command.status!=="approved")throw new Error("COMMAND_NOT_APPROVED");
  if(command.action_type==="purchase_request")throw new Error("PURCHASING_DISABLED_UNTIL_SPEND_POLICY_IS_CONFIGURED");
  const {data:integrations}=await db.from("integrations").select("*").eq("restaurant_id",command.restaurant_id).eq("status","connected");
  if(command.action_type==="supplier_email"){
    const to=String(command.parameters?.email||""); if(!/^\S+@\S+\.\S+$/.test(to))throw new Error("VALID_VENDOR_EMAIL_REQUIRED"); if(!process.env.RESEND_API_KEY)throw new Error("RESEND_NOT_CONFIGURED");
    await new Resend(process.env.RESEND_API_KEY).emails.send({from:process.env.NOTIFICATION_FROM!,to,subject:String(command.parameters?.subject||`Request from ${command.restaurants?.name}`),text:String(command.parameters?.message||command.summary)});
  }else{
    const webhook=integrations?.find((i:any)=>i.provider==="custom_webhook"); if(!webhook?.config?.url)throw new Error("NO_EXECUTION_CONNECTOR");
    const response=await fetch(webhook.config.url,{method:"POST",headers:{"Content-Type":"application/json","Idempotency-Key":job.idempotency_key,"X-Tauranto-Signature":process.env.CONNECTOR_WEBHOOK_SECRET||""},body:JSON.stringify({commandId:command.id,type:command.action_type,parameters:command.parameters,approved:true})});if(!response.ok)throw new Error(`CONNECTOR_FAILED_${response.status}`);
  }
  await db.from("commands").update({status:"completed"}).eq("id",command.id); await db.from("execution_jobs").update({status:"completed",completed_at:new Date().toISOString()}).eq("id",job.id);
  await db.from("audit_events").insert({restaurant_id:command.restaurant_id,command_id:command.id,event:"execution_completed",metadata:{job_id:job.id}});
}
