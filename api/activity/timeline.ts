import type {VercelRequest,VercelResponse} from '@vercel/node';
import {z} from 'zod';
import {admin,fail,requireUser} from '../../server/http';

const query=z.object({restaurantId:z.string().uuid(),limit:z.coerce.number().int().min(10).max(100).default(60)});
export default async function handler(req:VercelRequest,res:VercelResponse){
 if(req.method!=='GET')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
 try{
  const user=await requireUser(req),{restaurantId,limit}=query.parse(req.query),db=admin();
  const {data:membership}=await db.from('restaurant_members').select('role').eq('restaurant_id',restaurantId).eq('user_id',user.id).eq('active',true).maybeSingle();if(!membership)throw new Error('FORBIDDEN');
  const [{data:audit,error:auditError},{data:tableEvents,error:tableError}]=await Promise.all([
   db.from('audit_events').select('id,event,metadata,created_at,actor_id,command_id').eq('restaurant_id',restaurantId).order('created_at',{ascending:false}).limit(limit),
   db.from('guest_session_events').select('id,event_type,summary,payload,created_at,actor_id,session_id').eq('restaurant_id',restaurantId).order('created_at',{ascending:false}).limit(Math.min(limit,40))
  ]);if(auditError)throw auditError;if(tableError)throw tableError;
  const actorIds=[...new Set([...(audit||[]),...(tableEvents||[])].map((x:any)=>x.actor_id).filter(Boolean))],commandIds=[...new Set((audit||[]).map((x:any)=>x.command_id).filter(Boolean))];
  const [{data:profiles},{data:commands}]=await Promise.all([actorIds.length?db.from('profiles').select('id,full_name,email').in('id',actorIds):Promise.resolve({data:[]}),commandIds.length?db.from('commands').select('id,title,summary,status,action_type').in('id',commandIds):Promise.resolve({data:[]})]);
  const people=new Map((profiles||[]).map((x:any)=>[x.id,x])),commandMap=new Map((commands||[]).map((x:any)=>[x.id,x]));
  const activity=[...(audit||[]).map((x:any)=>({id:`audit-${x.id}`,kind:x.event.startsWith('integration_')?'integration':x.event.startsWith('approval_')?'approval':x.event.startsWith('command_')?'command':'account',event:x.event,summary:commandMap.get(x.command_id)?.title||humanize(x.event),detail:commandMap.get(x.command_id)?.summary||metadataDetail(x.metadata),status:commandMap.get(x.command_id)?.status||null,actorName:people.get(x.actor_id)?.full_name||people.get(x.actor_id)?.email||'Tauranto',createdAt:x.created_at})),...(tableEvents||[]).map((x:any)=>({id:`table-${x.id}`,kind:'tables',event:x.event_type,summary:x.summary||humanize(x.event_type),detail:metadataDetail(x.payload),status:null,actorName:people.get(x.actor_id)?.full_name||people.get(x.actor_id)?.email||'Tauranto',createdAt:x.created_at}))].sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)).slice(0,limit);
  return res.json({activities:activity});
 }catch(e){return fail(res,e)}
}
function humanize(value:string){return value.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
function metadataDetail(value:any){if(!value||typeof value!=='object')return null;const fields=['provider','source','kind','state','mode'];return fields.filter(k=>value[k]).map(k=>`${humanize(k)}: ${String(value[k]).replace(/_/g,' ')}`).join(' · ')||null}
