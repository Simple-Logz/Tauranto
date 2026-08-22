import type {VercelRequest,VercelResponse} from "@vercel/node";import {admin,fail,requireUser} from "../../server/http";
// Records demand for integrations that are not live yet. Keep this endpoint
// compatible with databases that were created before requested_by was added:
// restaurant_id + catalog_key are the durable fields required by the UI.
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
  const base={restaurant_id:restaurantId,catalog_key:catalogKey};
  let {error}=await db.from("integration_requests").upsert({...base,requested_by:user.id},{onConflict:"restaurant_id,catalog_key",ignoreDuplicates:true});
  // Some deployed environments predate migration 021's requested_by field.
  // Retry with the stable columns instead of exposing a raw schema-cache error.
  if(error&&(/requested_by/i.test(error.message||'')||/schema cache/i.test(error.message||''))){
   const retry=await db.from("integration_requests").upsert(base,{onConflict:"restaurant_id,catalog_key",ignoreDuplicates:true});error=retry.error;
  }
  if(error)throw error;
  return res.json({requested:true});
 }catch(e){return fail(res,e)}
}
