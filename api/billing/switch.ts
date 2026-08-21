import type {VercelRequest,VercelResponse} from "@vercel/node";
import {z} from "zod";
import Stripe from "stripe";
import {admin,fail,requireUser} from "../../server/http";
// Paid plans go through Stripe Checkout (see api/billing/checkout.ts) and are
// activated by the Stripe webhook once payment is confirmed — this endpoint
// only ever switches a restaurant to the free plan directly, so there is no
// way to grant a paid plan's entitlements without actually paying for it.
const schema=z.object({restaurantId:z.string().uuid(),planId:z.literal("free")});
export default async function handler(req:VercelRequest,res:VercelResponse){
 if(req.method!=="POST")return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
 try{
  const user=await requireUser(req),body=schema.parse(req.body),db=admin();
  const {data:member}=await db.from("restaurant_members").select("role").eq("restaurant_id",body.restaurantId).eq("user_id",user.id).eq("active",true).single();
  if(!member||!['owner','admin'].includes(member.role))throw new Error("FORBIDDEN");
  const {data:plan,error:planError}=await db.from("plans").select("id,name,monthly_price_cents,description,features,entitlements").eq("id","free").eq("active",true).single();if(planError)throw planError;
  const {data:existing}=await db.from("restaurant_subscriptions").select("id,provider,provider_subscription_id").eq("restaurant_id",body.restaurantId).maybeSingle();
  if(existing?.provider==="stripe"&&existing.provider_subscription_id&&process.env.STRIPE_SECRET_KEY){
   try{await new Stripe(process.env.STRIPE_SECRET_KEY).subscriptions.cancel(existing.provider_subscription_id)}
   catch(e){console.warn("Stripe subscription cancel failed while downgrading to free",e)}
  }
  let subscription:any;
  if(existing){const {data,error}=await db.from("restaurant_subscriptions").update({plan_id:"free",status:"active",provider:"none",provider_subscription_id:null,current_period_end:null,updated_at:new Date().toISOString()}).eq("id",existing.id).select("id,status,current_period_end,plan_id").single();if(error)throw error;subscription=data}
  else{const {data,error}=await db.from("restaurant_subscriptions").insert({restaurant_id:body.restaurantId,plan_id:"free",status:"active",provider:"none"}).select("id,status,current_period_end,plan_id").single();if(error)throw error;subscription=data}
  await db.from("audit_events").insert({restaurant_id:body.restaurantId,actor_id:user.id,event:"plan_switched_to_free",metadata:{plan_id:"free"}});
  return res.json({subscription:{...subscription,plans:plan}});
 }catch(error){return fail(res,error)}
}
