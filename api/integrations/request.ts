import type {VercelRequest,VercelResponse} from "@vercel/node";import {admin,fail,requireUser} from "../../server/http";
// Records real, trackable demand for a catalog entry that doesn't have a
// live connection yet — a genuine database row per restaurant per key
// (unique constraint in migration 021 makes a repeat tap a no-op, not
// duplicate rows), so which integrations to build next is a question the
// data can answer instead of a guess.
export default async function handler(req:VercelRequest,res:VercelResponse){
 if(req.method!=="POST")return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
 try{
  const user=await requireUser(req),db=admin();
  const restaurantId=String(req.body?.restaurantId||""),catalogKey=String(req.body?.catalogKey||"");
  if(!restaurantId||!catalogKey)throw new Error("RESTAURANT_AND_KEY_REQUIRED");
  const {data:member}=await db.from("restaurant_members").select("role").eq("restaurant_id",restaurantId).eq("user_id",user.id).eq("active",true).maybeSingle();
  if(!member)throw new Error("FORBIDDEN");
  const {data:entry}=await db.from("integration_catalog").select("key").eq("key",catalogKey).maybeSingle();
  if(!entry)throw new Error("UNKNOWN_INTEGRATION");
  const {error}=await db.from("integration_requests").upsert({restaurant_id:restaurantId,catalog_key:catalogKey,requested_by:user.id},{onConflict:"restaurant_id,catalog_key",ignoreDuplicates:true});
  if(error)throw error;
  return res.json({requested:true});
 }catch(e){return fail(res,e)}
}
