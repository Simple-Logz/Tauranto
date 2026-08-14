import { createClient } from "@supabase/supabase-js";
const url=process.env.EXPO_PUBLIC_SUPABASE_URL||"https://configuration-required.supabase.co", anon=process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY||"configuration-required";
export const supabase=createClient(url,anon,{auth:{persistSession:true,autoRefreshToken:true}});
const base=(process.env.EXPO_PUBLIC_API_URL||"").replace(/\/$/,"");
async function request(path:string,init:RequestInit={}){const {data}=await supabase.auth.getSession();const response=await fetch(`${base}${path}`,{...init,headers:{"Content-Type":"application/json",Authorization:`Bearer ${data.session?.access_token||""}`,...init.headers}});const body=await response.json();if(!response.ok)throw new Error(body.error||"REQUEST_FAILED");return body;}
export const taurantoApi={interpret:(restaurantId:string,transcript:string,source:"voice"|"typed")=>request("/api/commands/interpret",{method:"POST",body:JSON.stringify({restaurantId,transcript,source})}),decide:(approvalId:string,decision:"approved"|"rejected",note?:string)=>request("/api/approvals/decision",{method:"POST",body:JSON.stringify({approvalId,decision,note})})};
