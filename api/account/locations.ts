import type {VercelRequest,VercelResponse} from "@vercel/node";
import {admin,fail,requireUser} from "../../server/http";
import {membershipFor,visibleLocations} from "../../server/locations";

// Every restaurant row belongs to an organization (see migration 019) — a
// single-location restaurant just has an organization of one. This endpoint
// lets a chain see and manage every location it actually has access to, and
// lets an owner/admin spin up a new location without leaving the app.

async function locationStats(db:any,restaurantId:string){
 const startOfDay=new Date();startOfDay.setHours(0,0,0,0);
 const [{count:pending},{count:completedToday},{count:connected}]=await Promise.all([
  db.from("commands").select("id",{count:"exact",head:true}).eq("restaurant_id",restaurantId).eq("status","pending_approval"),
  db.from("commands").select("id",{count:"exact",head:true}).eq("restaurant_id",restaurantId).eq("status","completed").gte("created_at",startOfDay.toISOString()),
  db.from("integrations").select("id",{count:"exact",head:true}).eq("restaurant_id",restaurantId).eq("status","connected"),
 ]);
 return {pending:pending||0,completedToday:completedToday||0,connected:connected||0};
}

export default async function handler(req:VercelRequest,res:VercelResponse){
 try{
  const user=await requireUser(req),db=admin();
  if(req.method==="GET"){
   const restaurantId=String(req.query.restaurantId||"");
   if(!restaurantId)throw new Error("RESTAURANT_REQUIRED");
   const {home,organization,locations}=await visibleLocations(db,user.id,restaurantId);
   if(!home)throw new Error("RESTAURANT_NOT_FOUND");
   if(!locations.some(l=>l.id===restaurantId))throw new Error("FORBIDDEN");
   const rows=await Promise.all(locations.map(async(r)=>{
    const [{count:memberCount},stats]=await Promise.all([
     db.from("restaurant_members").select("user_id",{count:"exact",head:true}).eq("restaurant_id",r.id).eq("active",true),
     locationStats(db,r.id),
    ]);
    return {id:r.id,name:r.name,timezone:r.timezone,role:r.role,memberCount:memberCount||0,isCurrent:r.id===restaurantId,...stats};
   }));
   const canAddLocation=rows.some(l=>["owner","admin"].includes(l.role));
   return res.json({organization,locations:rows,canAddLocation});
  }
  if(req.method==="POST"){
   const restaurantId=String(req.body?.restaurantId||""),name=String(req.body?.name||"").trim();
   if(!restaurantId||!name)throw new Error("RESTAURANT_AND_NAME_REQUIRED");
   const me=await membershipFor(db,user.id,restaurantId);
   if(!me||!["owner","admin"].includes(me.role))throw new Error("FORBIDDEN");
   const {data:source}=await db.from("restaurants").select("id,name,timezone,organization_id,approval_mode").eq("id",restaurantId).single();
   if(!source)throw new Error("RESTAURANT_NOT_FOUND");
   let orgId=source.organization_id;
   if(!orgId){
    const {data:org,error:orgError}=await db.from("organizations").insert({name:source.name,owner_id:user.id}).select("id").single();
    if(orgError)throw orgError;
    orgId=org.id;
    await db.from("restaurants").update({organization_id:orgId}).eq("id",restaurantId);
   }
   const timezone=String(req.body?.timezone||source.timezone||"America/New_York");
   const {data:created,error}=await db.from("restaurants").insert({name,timezone,approval_mode:source.approval_mode,organization_id:orgId}).select("id,name,timezone").single();
   if(error)throw error;
   await db.from("restaurant_members").insert({restaurant_id:created.id,user_id:user.id,role:"owner",can_approve:true,active:true});
   await db.from("audit_events").insert({restaurant_id:created.id,actor_id:user.id,event:"location_created",metadata:{organizationId:orgId,createdFromRestaurantId:restaurantId}});
   return res.status(201).json({location:created});
  }
  return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
 }catch(e){return fail(res,e)}
}
