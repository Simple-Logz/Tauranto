import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";
import { admin, fail } from "../../server/http";
import { executeJob } from "../../server/executor";

function isAuthorized(req: VercelRequest) {
  const expected = process.env.CRON_SECRET || "";
  const provided = req.headers.authorization || "";
  const expectedHeader = `Bearer ${expected}`;
  const a = Buffer.from(provided);
  const b = Buffer.from(expectedHeader);
  // Length must match before timingSafeEqual will run; a length check alone
  // leaks only the secret's length, not its content.
  if (!expected || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Two independent schedulers (Vercel cron + the GitHub Actions workflow) can
// call this endpoint at overlapping times. Claiming a job is therefore done
// as a single conditional UPDATE per job rather than a separate select+update:
// the UPDATE only affects a row if it is still queued/retrying at the moment
// Postgres applies it, so a second concurrent caller's claim on the same row
// simply matches zero rows instead of executing the job a second time.
async function claimJob(db: ReturnType<typeof admin>, job: { id: string; attempts: number }) {
  const { data, error } = await db
    .from("execution_jobs")
    .update({ status: "executing", attempts: job.attempts + 1 })
    .eq("id", job.id)
    .in("status", ["queued", "retrying"])
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data; // null means another runner already claimed this job
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAuthorized(req)) return res.status(401).json({ error: "UNAUTHORIZED" });
  try {
    const db = admin();
    const now = new Date().toISOString();
    const { data: candidates } = await db
      .from("execution_jobs")
      .select("*")
      .in("status", ["queued", "retrying"])
      .lt("attempts", 4)
      .or(`next_attempt_at.is.null,next_attempt_at.lte.${now}`)
      .limit(50);

    const due = (candidates || [])
      .filter((j: any) => !j.execute_at || new Date(j.execute_at).getTime() <= Date.now())
      .slice(0, 20);

    const results: any[] = [];
    for (const candidate of due) {
      const job = await claimJob(db, candidate);
      if (!job) {
        results.push({ id: candidate.id, status: "already_claimed" });
        continue;
      }
      try {
        await executeJob(job);
        results.push({ id: job.id, status: "completed" });
      } catch (e) {
        const message = e instanceof Error ? e.message : "FAILED";
        const attempt = job.attempts;
        const retry = attempt < 4;
        const next = retry ? new Date(Date.now() + Math.pow(2, attempt) * 30000).toISOString() : null;
        await db
          .from("execution_jobs")
          .update({ status: retry ? "retrying" : "failed", last_error: message, next_attempt_at: next })
          .eq("id", job.id);
        const { data: command } = await db.from("commands").select("restaurant_id").eq("id", job.command_id).single();
        if (command) {
          await db.from("operation_events").insert({
            restaurant_id: command.restaurant_id,
            command_id: job.command_id,
            job_id: job.id,
            stage: "execute",
            status: retry ? "retrying" : "failed",
            detail: { error: message, attempt, next },
          });
        }
        results.push({ id: job.id, status: retry ? "retrying" : "failed", error: message });
      }
    }
    return res.json({ results, waiting: (candidates || []).length - due.length });
  } catch (e) {
    return fail(res, e);
  }
}
