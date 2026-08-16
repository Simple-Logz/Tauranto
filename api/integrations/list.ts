import type { VercelRequest, VercelResponse } from "@vercel/node";
import { admin, fail, requireUser } from "../../server/http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  try {
    const user = await requireUser(req);
    const restaurantId = String(req.query.restaurantId || "");
    const db = admin();
    const { data: member } = await db.from("restaurant_members").select("role").eq("restaurant_id", restaurantId).eq("user_id", user.id).eq("active", true).single();
    if (!member) throw new Error("FORBIDDEN");
    const { data, error } = await db.from("integrations").select("id,provider,display_name,status,config,created_at").eq("restaurant_id", restaurantId).order("created_at", { ascending: false });
    if (error) throw error;
    return res.json({ integrations: data || [] });
  } catch (error) { return fail(res, error); }
}
