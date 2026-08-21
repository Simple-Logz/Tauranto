import type {VercelRequest,VercelResponse} from "@vercel/node";
import {z} from "zod";
import {admin,fail,requireUser} from "../../server/http";
const schema=z.object({restaurantId:z.string().uuid(),planId:z.enum(["free","basic","enterprise"])});
export default async function handler(req:VercelRequest,res:VercelResponse){
 if(req.method!=="POST")return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
 try{
  const user=await requireUser(req),body=schema.parse(req.body),db=admin();
  const {data:member}=await db.from("restaurant_members").select("role").eq("restaurant_id",body.restaurantId).eq("user_id",user.id).eq("active",true).single();
  if(!member||!['owner','admin'].includes(member.role))throw new Error("FORBIDDEN");
  if(body.planId!=="free")return res.status(409).json({error:"PAID_PLAN_REQUIRES_STRIPE_CHECKOUT"});
  const {data:plan,error:planError}=await db.from("plans").select("id,name,monthly_price_cents,description,features,entitlements").eq("id",body.planId).eq("active",true).single();if(planError)throw planError;
  const {data:existing}=await db.from("restaurant_subscriptions").select("id").eq("restaurant_id",body.restaurantId).maybeSingle();
  let subscription:any;
  if(existing){const {data,error}=await db.from("restaurant_subscriptions").update({plan_id:"free",status:"active",provider:"internal",provider_subscription_id:null,current_period_end:null,updated_at:new Date().toISOString()}).eq("id",existing.id).select("id,status,current_period_end,plan_id").single();if(error)throw error;subscription=data}
  else{const {data,error}=await db.from("restaurant_subscriptions").insert({restaurant_id:body.restaurantId,plan_id:"free",status:"active",provider:"internal"}).select("id,status,current_period_end,plan_id").single();if(error)throw error;subscription=data}
  await db.from("audit_events").insert({restaurant_id:body.restaurantId,actor_id:user.id,event:"plan_changed",metadata:{plan_id:"free",provider:"internal"}});
  return res.json({subscription:{...subscription,plans:plan},testing:false});
 }catch(error){return fail(res,error)}
}
