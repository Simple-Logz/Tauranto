import type { VercelRequest, VercelResponse } from "@vercel/node";
import { admin, fail, requireUser } from "../../server/http";
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try { const user = await requireUser(req); const restaurantId = String(req.query.restaurantId || ""); const db = admin();
    const { data: member } = await db.from("restaurant_members").select("role").eq("restaurant_id", restaurantId).eq("user_id", user.id).single(); if (!member) throw new Error("FORBIDDEN");
    const { data, error } = await db.from("commands").select("*,approvals(id,approver_id,status,decided_at)").eq("restaurant_id", restaurantId).order("created_at", { ascending: false }).limit(100); if (error) throw error;
    return res.json({ commands: data });
  } catch (e) { return fail(res,e); }
}
