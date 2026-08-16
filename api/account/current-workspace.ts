import type {VercelRequest,VercelResponse} from "@vercel/node";
import {admin,fail,requireUser} from "../../server/http";

export default async function handler(req:VercelRequest,res:VercelResponse){
  if(req.method!=="GET") return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
  try{
    const user=await requireUser(req),db=admin();
    const {data,error}=await db.from("restaurant_members")
      .select("restaurant_id,role,can_approve,restaurants(id,name,timezone)")
      .eq("user_id",user.id).eq("active",true)
      .order("restaurant_id").limit(20);
    if(error) throw error;
    const memberships=data||[];
    if(!memberships.length) return res.status(404).json({error:"NO_RESTAURANT_MEMBERSHIP"});
    const preferred=String(req.query.preferred||"");
    const active=memberships.find((m:any)=>m.restaurant_id===preferred)||memberships[0];
    return res.json({restaurantId:active.restaurant_id,membership:active,memberships});
  }catch(e){return fail(res,e)}
}
