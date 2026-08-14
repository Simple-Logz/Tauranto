import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { admin, fail, requireUser } from "../../server/http";
import { interpretWithAI } from "../../server/agent";
import { notifyApprovers } from "../../server/notify";

const bodySchema = z.object({ restaurantId: z.string().uuid(), transcript: z.string().min(2).max(4000), source: z.enum(["voice", "typed"]).default("voice") });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  try {
    const user = await requireUser(req); const body = bodySchema.parse(req.body); const db = admin();
    const { data: membership } = await db.from("restaurant_members").select("role,restaurants(name,timezone)").eq("restaurant_id", body.restaurantId).eq("user_id", user.id).single();
    if (!membership) throw new Error("FORBIDDEN");
    const proposal = await interpretWithAI(body.transcript, JSON.stringify(membership.restaurants));
    const state = proposal.ambiguities.length || proposal.confidence < .82 ? "needs_clarification" : "pending_approval";
    const { data: command, error } = await db.from("commands").insert({ restaurant_id: body.restaurantId, created_by: user.id, source: body.source, transcript: body.transcript, ...proposal, status: state }).select().single();
    if (error) throw error;
    if (state === "pending_approval") {
      const { data: managers } = await db.from("restaurant_members").select("user_id,profiles(full_name,email)").eq("restaurant_id", body.restaurantId).eq("can_approve", true).eq("active", true);
      const approvals = (managers || []).map((m: any) => ({ command_id: command.id, approver_id: m.user_id, status: "pending" }));
      if (!approvals.length) throw new Error("NO_APPROVAL_MANAGERS");
      const { data: createdApprovals } = await db.from("approvals").insert(approvals).select("id,approver_id");
      await notifyApprovers((managers || []).map((m:any) => m.profiles), command);
      (command as any).approvalId = createdApprovals?.find(a => a.approver_id === user.id)?.id;
    }
    await db.from("audit_events").insert({ restaurant_id: body.restaurantId, command_id: command.id, actor_id: user.id, event: "command_created", metadata: { source: body.source, state } });
    return res.status(201).json({ command, spokenReply: state === "needs_clarification" ? proposal.confirmation_question : `I understood ${proposal.summary}. I sent it for approval and will not act until it is approved.` });
  } catch (error) { return fail(res, error); }
}
