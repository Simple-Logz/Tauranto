import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, type User } from "@supabase/supabase-js";

export const admin = () => createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

export async function requireUser(req: VercelRequest): Promise<User> {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("UNAUTHORIZED");
  const { data, error } = await admin().auth.getUser(token);
  if (error || !data.user) throw new Error("UNAUTHORIZED");
  return data.user;
}

export function fail(res: VercelResponse, error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
  const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 400;
  return res.status(status).json({ error: message });
}
