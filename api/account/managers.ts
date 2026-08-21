import type { VercelRequest, VercelResponse } from "@vercel/node";
import { admin, fail, requireUser } from "../../server/http";
export default async function handler(req: VercelRequest, res: VercelResponse) { try {
    const user = await requireUser(req), restaurantId = String(req.method === "GET" ? req.query.restaurantId : req.body?.restaurantId || "");
    if (!restaurantId)
        throw new Error("RESTAURANT_REQUIRED");
    const db = admin(), { data: me } = await db.from("restaurant_members").select("role,active").eq("restaurant_id", restaurantId).eq("user_id", user.id).eq("active", true).single();
    if (!me)
        throw new Error("FORBIDDEN");
    if (req.method === "GET") {
        const [{ data: members }, { data: invites }] = await Promise.all([db.from("restaurant_members").select("user_id,role,can_approve,active,profiles(full_name,email,phone)").eq("restaurant_id", restaurantId).eq("active", true), db.from("manager_invites").select("id,name,email,phone,role,can_approve,status,created_at").eq("restaurant_id", restaurantId).order("created_at", { ascending: false })]);
        return res.json({ members: members || [], invites: invites || [] });
    }
    if (req.method === "POST") {
        if (!["owner", "admin"].includes(me.role))
            throw new Error("FORBIDDEN");
        const name = String(req.body?.name || "").trim(), email = String(req.body?.email || "").trim().toLowerCase(), phone = String(req.body?.phone || "").trim();
        if (!name || !email)
            throw new Error("NAME_AND_EMAIL_REQUIRED");
        const { data, error } = await db.from("manager_invites").upsert({ restaurant_id: restaurantId, name, email, phone, role: "manager", can_approve: true, status: "pending", invited_by: user.id }, { onConflict: "restaurant_id,email" }).select().single();
        if (error)
            throw error;
        return res.status(201).json({ invite: data });
    }
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
}
catch (e) {
    return fail(res, e);
} }
