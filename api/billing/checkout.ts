import type {VercelRequest,VercelResponse} from "@vercel/node";
import {z} from "zod";
import {admin,fail,requireUser} from "../../server/http";

const schema=z.object({restaurantId:z.string().uuid(),planId:z.enum(["basic","enterprise"])});
const priceFor=(plan:string)=>plan==="basic"?process.env.STRIPE_BASIC_PRICE_ID:process.env.STRIPE_ENTERPRISE_PRICE_ID;
export default async function handler(req:VercelRequest,res:VercelResponse){
 if(req.method!=="POST")return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
 try{
  const user=await requireUser(req),body=schema.parse(req.body),db=admin();
  const {data:member}=await db.from("restaurant_members").select("role").eq("restaurant_id",body.restaurantId).eq("user_id",user.id).eq("active",true).single();
  if(!member||!["owner","admin"].includes(member.role))throw new Error("FORBIDDEN");
  const secret=process.env.STRIPE_SECRET_KEY,price=priceFor(body.planId),base=(process.env.APP_URL||"").replace(/\/$/,"");
  if(!secret||!price||!base)return res.status(503).json({error:"STRIPE_NOT_CONFIGURED"});
  const {data:existing}=await db.from("restaurant_subscriptions").select("provider_customer_id").eq("restaurant_id",body.restaurantId).maybeSingle();
  const form=new URLSearchParams({mode:"subscription","line_items[0][price]":price,"line_items[0][quantity]":"1",success_url:`${base}/?billing=success`,cancel_url:`${base}/?billing=cancelled`,"metadata[restaurant_id]":body.restaurantId,"metadata[plan_id]":body.planId,"subscription_data[metadata][restaurant_id]":body.restaurantId,"subscription_data[metadata][plan_id]":body.planId,"customer_email":user.email||""});
  if(existing?.provider_customer_id){form.delete("customer_email");form.set("customer",existing.provider_customer_id)}
  const response=await fetch("https://api.stripe.com/v1/checkout/sessions",{method:"POST",headers:{Authorization:`Bearer ${secret}`,"Content-Type":"application/x-www-form-urlencoded"},body:form});
  const session:any=await response.json();if(!response.ok||!session.url)throw new Error(session?.error?.message||"STRIPE_CHECKOUT_FAILED");
  await db.from("audit_events").insert({restaurant_id:body.restaurantId,actor_id:user.id,event:"billing_checkout_started",metadata:{plan_id:body.planId,checkout_session_id:session.id}});
  return res.json({url:session.url});
 }catch(e){return fail(res,e)}
}
