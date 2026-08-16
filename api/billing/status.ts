import type { VercelRequest,VercelResponse } from "@vercel/node";
import {admin,fail,requireUser} from "../../server/http";
export default async function handler(req:VercelRequest,res:VercelResponse){
 if(req.method!=="GET")return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
 try{
  const user=await requireUser(req),restaurantId=String(req.query.restaurantId||""),db=admin();
  const {data:member}=await db.from("restaurant_members").select("role").eq("restaurant_id",restaurantId).eq("user_id",user.id).eq("active",true).single();
  if(!member)throw new Error("FORBIDDEN");
  const {data:subscription}=await db.from("restaurant_subscriptions").select("id,status,current_period_end,plan_id,plans(id,name,monthly_price_cents,description,features,entitlements)").eq("restaurant_id",restaurantId).maybeSingle();
  if(subscription)return res.json({subscription});
  const {data:plan,error}=await db.from("plans").select("id,name,monthly_price_cents,description,features,entitlements").eq("id","basic").single();if(error)throw error;
  return res.json({subscription:{status:"trialing",plan_id:"basic",plans:plan,provisional:true}});
 }catch(error){return fail(res,error)}
}
