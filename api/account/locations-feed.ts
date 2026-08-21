import type {VercelRequest,VercelResponse} from "@vercel/node";
import {admin,fail,requireUser} from "../../server/http";
import {visibleLocations} from "../../server/locations";

// A merged activity + approvals feed across every location the caller can
// access in this restaurant's chain — so a multi-location operator isn't
// stuck flipping the active location back and forth just to see what needs
// their attention. Each row is tagged with which location it belongs to;
// approving/rejecting still goes through the existing approvalId-keyed
// /api/approvals/decision endpoint, which needs no restaurant context, so
// the client can act on a row here without switching locations first.
export default async function handler(req:VercelRequest,res:VercelResponse){
 if(req.method!=="GET")return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
 try{
  const user=await requireUser(req),db=admin();
  const restaurantId=String(req.query.restaurantId||"");
  if(!restaurantId)throw new Error("RESTAURANT_REQUIRED");
  const {home,locations}=await visibleLocations(db,user.id,restaurantId);
  if(!home)throw new Error("RESTAURANT_NOT_FOUND");
  if(!locations.some(l=>l.id===restaurantId))throw new Error("FORBIDDEN");
  const byId=new Map(locations.map(l=>[l.id,l.name]));
  const {data,error}=await db.from("commands")
   .select("id,restaurant_id,transcript,title,summary,action_type,risk,status,created_at,approvals(id,approver_id,status)")
   .in("restaurant_id",locations.map(l=>l.id))
   .order("created_at",{ascending:false})
   .limit(60);
  if(error)throw error;
  const rows=(data||[]).map((c:any)=>({...c,locationName:byId.get(c.restaurant_id)||"Location",myApprovalId:(c.approvals||[]).find((a:any)=>a.status==="pending"&&a.approver_id===user.id)?.id||null}));
  return res.json({locations:locations.map(l=>({id:l.id,name:l.name})),commands:rows});
 }catch(e){return fail(res,e)}
}
