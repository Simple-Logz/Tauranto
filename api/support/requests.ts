import type {VercelRequest,VercelResponse} from "@vercel/node";
import {admin,fail,requireUser} from "../../server/http";
import {Resend} from "resend";

export default async function handler(req:VercelRequest,res:VercelResponse){
 try{
  const user=await requireUser(req),restaurantId=String(req.method==="GET"?req.query.restaurantId:req.body?.restaurantId||"");
  if(!restaurantId)throw new Error("RESTAURANT_REQUIRED");const db=admin();
  const {data:member}=await db.from("restaurant_members").select("role,active").eq("restaurant_id",restaurantId).eq("user_id",user.id).eq("active",true).single();if(!member)throw new Error("FORBIDDEN");
  if(req.method==="GET"){let q=db.from("support_requests").select("id,email,subject,message,status,created_at").eq("restaurant_id",restaurantId).order("created_at",{ascending:false}).limit(20);if(!["owner","admin"].includes(member.role))q=q.eq("requested_by",user.id);const {data,error}=await q;if(error)throw error;return res.json({requests:data||[]})}
  if(req.method==="POST"){
   const email=String(req.body?.email||user.email||"").trim(),subject=String(req.body?.subject||"").trim(),message=String(req.body?.message||"").trim();if(!email||!subject||!message)throw new Error("EMAIL_SUBJECT_MESSAGE_REQUIRED");
   const {data:ticket,error}=await db.from("support_requests").insert({restaurant_id:restaurantId,requested_by:user.id,email,subject,message}).select().single();if(error)throw error;
   let emailSent=false;const supportTo=process.env.SUPPORT_EMAIL,from=process.env.NOTIFICATION_FROM;
   if(process.env.RESEND_API_KEY&&supportTo&&from){const result=await new Resend(process.env.RESEND_API_KEY).emails.send({from,to:supportTo,replyTo:email,subject:`Tauranto support: ${subject}`,text:`Restaurant: ${restaurantId}\nRequester: ${email}\nTicket: ${ticket.id}\n\n${message}`});emailSent=!result.error}
   await db.from("audit_events").insert({restaurant_id:restaurantId,actor_id:user.id,event:"support_request_created",metadata:{ticket_id:ticket.id,email_sent:emailSent}});
   return res.status(201).json({ticket,emailSent});
  }
  return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
 }catch(e){return fail(res,e)}
}
