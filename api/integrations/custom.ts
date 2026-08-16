import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { admin, fail, requireUser } from "../../server/http";

const connectSchema = z.object({ restaurantId: z.string().uuid(), url: z.string().url().refine(value => value.startsWith("https://"), "WEBHOOK_MUST_USE_HTTPS"), displayName: z.string().min(2).max(80) });
const disconnectSchema = z.object({ restaurantId: z.string().uuid(), integrationId: z.string().uuid() });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST" && req.method !== "DELETE") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  try {
    const user = await requireUser(req);
    const db = admin();
    if (req.method === "DELETE") {
      const body = disconnectSchema.parse(req.body);
      const { data: member } = await db.from("restaurant_members").select("role").eq("restaurant_id", body.restaurantId).eq("user_id", user.id).in("role", ["owner", "admin"]).single();
      if (!member) throw new Error("FORBIDDEN");
      const { error } = await db.from("integrations").update({ status: "disconnected" }).eq("id", body.integrationId).eq("restaurant_id", body.restaurantId);
      if (error) throw error;
      return res.json({ status: "disconnected" });
    }
    const body = connectSchema.parse(req.body);
    const { data: member } = await db.from("restaurant_members").select("role").eq("restaurant_id", body.restaurantId).eq("user_id", user.id).in("role", ["owner", "admin"]).single();
    if (!member) throw new Error("FORBIDDEN");
    await db.from("integrations").update({ status: "disconnected" }).eq("restaurant_id", body.restaurantId).eq("provider", "custom_webhook").eq("status", "connected");
    const { data, error } = await db.from("integrations").insert({ restaurant_id: body.restaurantId, provider: "custom_webhook", display_name: body.displayName, status: "connected", config: { url: body.url } }).select("id,provider,display_name,status,config,created_at").single();
    if (error) throw error;
    await db.from("audit_events").insert({ restaurant_id: body.restaurantId, actor_id: user.id, event: "integration_connected", metadata: { provider: "custom_webhook", integration_id: data.id } });
    return res.status(201).json({ integration: data });
  } catch (error) { return fail(res, error); }
}
