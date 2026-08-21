import {supabase} from './api';
const base=(process.env.EXPO_PUBLIC_API_URL||'').replace(/\/$/,'');
async function get(path:string){const {data}=await supabase.auth.getSession();if(!data.session)throw new Error('Your session has expired.');const response=await fetch(`${base}${path}`,{headers:{Authorization:`Bearer ${data.session.access_token}`}});const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body.error||'Request failed');return body}
export const insightsApi={analytics:(restaurantId:string,days:number)=>get(`/api/analytics/overview?restaurantId=${encodeURIComponent(restaurantId)}&days=${days}`),activity:(restaurantId:string)=>get(`/api/activity/timeline?restaurantId=${encodeURIComponent(restaurantId)}`)};
