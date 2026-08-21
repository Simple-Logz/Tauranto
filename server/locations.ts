// Shared helpers for the multi-location endpoints (api/account/locations.ts,
// api/account/locations-feed.ts). Every restaurant belongs to an
// organization (migration 019) — for a restaurant that has never grown past
// one location, that organization simply has one member. These handlers run
// against the service-role client like the rest of this codebase's admin
// APIs, so visibility has to be enforced here rather than relying on
// Postgres RLS: a location is only ever surfaced if the CALLING user holds
// an active restaurant_members row there, which is exactly what RLS would
// have allowed them to see directly.
export async function membershipFor(db:any,userId:string,restaurantId:string){
 const {data}=await db.from("restaurant_members").select("role,can_approve,active").eq("restaurant_id",restaurantId).eq("user_id",userId).eq("active",true).maybeSingle();
 return data;
}

export async function visibleLocations(db:any,userId:string,restaurantId:string){
 const {data:home}=await db.from("restaurants").select("id,name,organization_id,organizations(id,name)").eq("id",restaurantId).single();
 if(!home)return {home:null as any,organization:null as any,locations:[] as {id:string;name:string;timezone?:string;role:string}[]};
 const orgId=home.organization_id;
 const {data:siblings}=orgId
  ?await db.from("restaurants").select("id,name,timezone").eq("organization_id",orgId).order("name")
  :{data:[home]};
 const rows=await Promise.all((siblings||[home]).map(async(r:any)=>{
  const membership=await membershipFor(db,userId,r.id);
  if(!membership)return null;
  return {id:r.id,name:r.name,timezone:r.timezone,role:membership.role as string};
 }));
 const organization=home.organizations||(orgId?{id:orgId,name:home.name}:{id:home.id,name:home.name});
 return {home,organization,locations:rows.filter(Boolean) as {id:string;name:string;timezone?:string;role:string}[]};
}
