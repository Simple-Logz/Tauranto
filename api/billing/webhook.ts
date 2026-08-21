import type {VercelRequest,VercelResponse} from "@vercel/node";
import crypto from "crypto";
import {admin} from "../../server/http";

export const config={api:{bodyParser:false}};
async function raw(req:VercelRequest){const chunks:Buffer[]=[];for await(const chunk of req)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk));return Buffer.concat(chunks).toString("utf8")}
function validSignature(payload:string,header:string,secret:string){const parts=Object.fromEntries(header.split(",").map(x=>x.split("=",2))) as Record<string,string>;if(!parts.t||!parts.v1)return false;const age=Math.abs(Date.now()/1000-Number(parts.t));if(!Number.isFinite(age)||age>300)return false;const expected=crypto.createHmac("sha256",secret).update(`${parts.t}.${payload}`).digest("hex");const a=Buffer.from(expected),b=Buffer.from(parts.v1);return a.length===b.length&&crypto.timingSafeEqual(a,b)}
export default async function handler(req:VercelRequest,res:VercelResponse){
 if(req.method!=="POST")return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
 const secret=process.env.STRIPE_WEBHOOK_SECRET;if(!secret)return res.status(503).json({error:"STRIPE_WEBHOOK_NOT_CONFIGURED"});
 try{
  const payload=await raw(req),signature=String(req.headers["stripe-signature"]||"");if(!validSignature(payload,signature,secret))return res.status(400).json({error:"INVALID_STRIPE_SIGNATURE"});
  const event=JSON.parse(payload),object=event.data?.object||{},db=admin();
  if(event.type==="checkout.session.completed"){
   const restaurantId=object.metadata?.restaurant_id,planId=object.metadata?.plan_id;if(restaurantId&&["basic","enterprise"].includes(planId))await db.from("restaurant_subscriptions").upsert({restaurant_id:restaurantId,plan_id:planId,status:"active",provider:"stripe",provider_customer_id:String(object.customer||""),provider_subscription_id:String(object.subscription||""),updated_at:new Date().toISOString()},{onConflict:"restaurant_id"});
  }
  if(event.type.startsWith("customer.subscription.")){
   const restaurantId=object.metadata?.restaurant_id,planId=object.metadata?.plan_id;if(restaurantId){const status=event.type==="customer.subscription.deleted"?"cancelled":object.status==="past_due"?"past_due":object.status==="active"||object.status==="trialing"?object.status:"cancelled";const update:any={status,provider:"stripe",provider_customer_id:String(object.customer||""),provider_subscription_id:String(object.id||""),current_period_end:object.current_period_end?new Date(object.current_period_end*1000).toISOString():null,updated_at:new Date().toISOString()};if(["basic","enterprise"].includes(planId))update.plan_id=planId;await db.from("restaurant_subscriptions").update(update).eq("restaurant_id",restaurantId)}
  }
  return res.json({received:true});
 }catch(e){console.error("stripe_webhook_failed",e);return res.status(400).json({error:"INVALID_STRIPE_EVENT"})}
}
