import type {VercelRequest,VercelResponse} from '@vercel/node';
import {z} from 'zod';
import {admin,fail,requireUser} from '../../server/http';

const query=z.object({restaurantId:z.string().uuid(),days:z.coerce.number().int().min(7).max(90).default(30)});
export default async function handler(req:VercelRequest,res:VercelResponse){
 if(req.method!=='GET')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
 try{
  const user=await requireUser(req),{restaurantId,days}=query.parse(req.query),db=admin();
  const {data:membership}=await db.from('restaurant_members').select('role').eq('restaurant_id',restaurantId).eq('user_id',user.id).eq('active',true).maybeSingle();
  if(!membership)throw new Error('FORBIDDEN');
  const since=new Date(Date.now()-(days-1)*86400000);since.setHours(0,0,0,0);
  const [{data:commands,error:commandError},{data:sessions,error:sessionError}]=await Promise.all([
   db.from('commands').select('id,status,action_type,confidence,created_at').eq('restaurant_id',restaurantId).gte('created_at',since.toISOString()).order('created_at',{ascending:true}),
   db.from('guest_sessions').select('party_size,status,opened_at,closed_at').eq('restaurant_id',restaurantId).gte('opened_at',since.toISOString())
  ]);
  if(commandError)throw commandError;if(sessionError)throw sessionError;
  const commandRows=commands||[],ids=commandRows.map((x:any)=>x.id);
  const {data:jobs,error:jobError}=ids.length?await db.from('execution_jobs').select('status,provider,completed_at,created_at,command_id').in('command_id',ids):{data:[],error:null};
  if(jobError)throw jobError;
  const statuses:Record<string,number>={},actions:Record<string,number>={},providers:Record<string,number>={};
  commandRows.forEach((x:any)=>{statuses[x.status]=(statuses[x.status]||0)+1;actions[x.action_type]=(actions[x.action_type]||0)+1});
  (jobs||[]).forEach((x:any)=>{providers[x.provider]=(providers[x.provider]||0)+1});
  const daily=Array.from({length:days},(_,i)=>{const date=new Date(since);date.setDate(date.getDate()+i);const key=date.toISOString().slice(0,10);return{date:key,commands:0,completed:0,failed:0}}),byDay=new Map(daily.map(x=>[x.date,x]));
  commandRows.forEach((x:any)=>{const day=byDay.get(String(x.created_at).slice(0,10));if(day){day.commands++;if(['completed','approved'].includes(x.status))day.completed++;if(['failed','rejected','needs_clarification'].includes(x.status))day.failed++}});
  const completed=(jobs||[]).filter((x:any)=>x.status==='completed').length,failed=(jobs||[]).filter((x:any)=>['failed','retrying'].includes(x.status)).length,totalJobs=(jobs||[]).length;
  return res.json({range:{days,since:since.toISOString()},totals:{commands:commandRows.length,completedCommands:commandRows.filter((x:any)=>['completed','approved'].includes(x.status)).length,executions:totalJobs,successfulExecutions:completed,failedExecutions:failed,guests:(sessions||[]).reduce((n:number,x:any)=>n+(x.party_size||0),0),tableSessions:(sessions||[]).length,averageConfidence:commandRows.length?commandRows.reduce((n:number,x:any)=>n+Number(x.confidence||0),0)/commandRows.length:null,executionSuccessRate:totalJobs?completed/totalJobs:null},daily,statuses,actions:Object.entries(actions).sort((a,b)=>b[1]-a[1]).map(([name,count])=>({name,count})),providers:Object.entries(providers).sort((a,b)=>b[1]-a[1]).map(([name,count])=>({name,count}))});
 }catch(e){return fail(res,e)}
}
