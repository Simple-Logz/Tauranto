import type {VercelRequest,VercelResponse} from "@vercel/node";
import {admin,fail,requireUser} from "../../server/http";

export default async function handler(req:VercelRequest,res:VercelResponse){
 try{
  const user=await requireUser(req),restaurantId=String(req.method==="GET"?req.query.restaurantId:req.body?.restaurantId||"");
  if(!restaurantId)throw new Error("RESTAURANT_REQUIRED");
  const db=admin(),{data:member}=await db.from("restaurant_members").select("role,active").eq("restaurant_id",restaurantId).eq("user_id",user.id).eq("active",true).single();
  if(!member)throw new Error("FORBIDDEN");
  if(req.method==="GET"){
   const {data,error}=await db.from("departments").select("id,name,description,created_at,department_members(user_id,profiles(full_name,email))").eq("restaurant_id",restaurantId).order("name");
   if(error)throw error;return res.json({departments:data||[]});
  }
  if(!["owner","admin"].includes(member.role))throw new Error("FORBIDDEN");
  if(req.method==="POST"){
   const name=String(req.body?.name||"").trim(),description=String(req.body?.description||"").trim(),memberIds=Array.isArray(req.body?.memberIds)?req.body.memberIds:[];
   if(!name)throw new Error("DEPARTMENT_NAME_REQUIRED");
   const {data:department,error}=await db.from("departments").insert({restaurant_id:restaurantId,name,description,created_by:user.id}).select().single();if(error)throw error;
   if(memberIds.length){const {data:valid}=await db.from("restaurant_members").select("user_id").eq("restaurant_id",restaurantId).eq("active",true).in("user_id",memberIds);if(valid?.length){const {error:joinError}=await db.from("department_members").insert(valid.map((x:any)=>({department_id:department.id,restaurant_id:restaurantId,user_id:x.user_id})));if(joinError)throw joinError}}
   return res.status(201).json({department});
  }
  if(req.method==="DELETE"){
   const departmentId=String(req.body?.departmentId||"");if(!departmentId)throw new Error("DEPARTMENT_REQUIRED");
   const {error}=await db.from("departments").delete().eq("id",departmentId).eq("restaurant_id",restaurantId);if(error)throw error;return res.json({ok:true});
  }
  return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
 }catch(e){return fail(res,e)}
}
