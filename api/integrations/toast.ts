import type {VercelRequest,VercelResponse} from "@vercel/node";import {z} from "zod";import {admin,fail,requireUser} from "../../server/http";import {encryptCredentials} from "../../server/credentials";
// Toast partner/custom integrations are not provisioned through a redirect
// OAuth flow like Gmail/Slack/HubSpot/Square/Zoom above — a restaurant (or
// Toast on their behalf, once Tauranto is an approved Integration Partner)
// issues a Client ID + Client Secret + Restaurant GUID from Toast's own back
// office, and the integration authenticates as a "machine client" directly
// against Toast's authentication endpoint. See doc.toasttab.com/doc/devguide/authentication.html.
const schema=z.object({restaurantId:z.string().uuid(),clientId:z.string().min(1).max(200),clientSecret:z.string().min(1).max(200),restaurantGuid:z.string().min(1).max(100)});
function toastBase(){return (process.env.TOAST_API_BASE_URL||"https://ws-api.toasttab.com").replace(/\/$/,"")}
export default async function handler(req:VercelRequest,res:VercelResponse){
  if(req.method!=="POST")return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
  try{
    const user=await requireUser(req),body=schema.parse(req.body),db=admin();
    const {data:member}=await db.from("restaurant_members").select("role").eq("restaurant_id",body.restaurantId).eq("user_id",user.id).eq("active",true).maybeSingle();
    if(!member||!["owner","admin"].includes(member.role))throw new Error("FORBIDDEN");
    // Validate the credentials immediately by actually authenticating,
    // rather than storing them unverified and only discovering a typo the
    // first time a command tries to execute.
    const r=await fetch(`${toastBase()}/authentication/v1/authentication/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({clientId:body.clientId,clientSecret:body.clientSecret,userAccessType:"TOAST_MACHINE_CLIENT"})});
    const j:any=await r.json().catch(()=>({}));
    if(!r.ok||j.status!=="SUCCESS"||!j.token?.accessToken)throw new Error("Toast rejected these credentials. Check the Client ID, Client Secret, and Restaurant GUID and try again.");
    const encrypted=encryptCredentials({clientId:body.clientId,clientSecret:body.clientSecret,restaurantGuid:body.restaurantGuid,accessToken:j.token.accessToken,expiresAt:Date.now()+Number(j.token.expiresIn||3600)*1000});
    const {data:existing}=await db.from("integrations").select("id").eq("restaurant_id",body.restaurantId).eq("provider","toast").maybeSingle();
    const row={restaurant_id:body.restaurantId,provider:"toast",display_name:"Toast",status:"connected",encrypted_credentials:encrypted,config:{restaurant_guid:body.restaurantGuid,connected_at:new Date().toISOString()}};
    const {data,error}=existing
      ?await db.from("integrations").update(row).eq("id",existing.id).select("id,provider,display_name,status,config,created_at").single()
      :await db.from("integrations").insert(row).select("id,provider,display_name,status,config,created_at").single();
    if(error)throw error;
    await db.from("audit_events").insert({restaurant_id:body.restaurantId,actor_id:user.id,event:"integration_connected",metadata:{provider:"toast"}});
    return res.status(201).json({integration:data});
  }catch(e){return fail(res,e)}
}
