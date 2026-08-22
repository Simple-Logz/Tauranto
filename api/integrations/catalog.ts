import type {VercelRequest,VercelResponse} from "@vercel/node";import {admin,fail,requireUser} from "../../server/http";
// The Integration Hub's real catalog — every platform worth supporting, held
// in public.integration_catalog (migration 021), not hardcoded in the app
// bundle. Search (`q`) runs as a real Postgres query, not a client-side
// filter, so "tied to a database" is literal. Each row is annotated with
// whether THIS restaurant is already connected (from public.integrations)
// or has already asked for it (from public.integration_requests), so the
// client can render CONNECTED / CONNECT / REQUESTED / REQUEST without a
// second round trip.
export default async function handler(req:VercelRequest,res:VercelResponse){
 if(req.method!=="GET")return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
 try{
  const user=await requireUser(req),db=admin();
  const restaurantId=String(req.query.restaurantId||"");
  if(!restaurantId)throw new Error("RESTAURANT_REQUIRED");
  const {data:member}=await db.from("restaurant_members").select("role").eq("restaurant_id",restaurantId).eq("user_id",user.id).eq("active",true).maybeSingle();
  if(!member)throw new Error("FORBIDDEN");
  const q=String(req.query.q||"").trim();
  let query=db.from("integration_catalog").select("key,name,category,description,connect_mode,sort_order").order("sort_order",{ascending:true});
  if(q)query=query.or(`name.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`);
  const [{data:catalog,error:catalogError},{data:connected,error:connectedError},{data:requested,error:requestedError}]=await Promise.all([
   query,
   db.from("integrations").select("provider,status").eq("restaurant_id",restaurantId).eq("status","connected"),
   db.from("integration_requests").select("catalog_key").eq("restaurant_id",restaurantId),
  ]);
  if(catalogError)throw catalogError;if(connectedError)throw connectedError;if(requestedError)throw requestedError;
  const connectedKeys=new Set((connected||[]).map((c:any)=>c.provider==="custom_webhook"?"website":c.provider));
  const requestedKeys=new Set((requested||[]).map((r:any)=>r.catalog_key));
  const items=(catalog||[]).map((c:any)=>({...c,connected:connectedKeys.has(c.key),requested:requestedKeys.has(c.key)}));
  return res.json({items});
 }catch(e){return fail(res,e)}
}
