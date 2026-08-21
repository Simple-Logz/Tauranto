import { admin } from "./http";

// Guards the endpoints that call OpenAI so a compromised session, a buggy
// client retry loop, or a deliberately abusive user can't run up an
// unbounded OpenAI bill. Backed by the `check_rate_limit` Postgres function
// (see supabase/migrations/016_rate_limits.sql) rather than an in-memory
// counter, since Vercel functions are stateless between invocations and an
// in-memory limit would reset on every cold start.
//
// This fails OPEN: if the rate-limit check itself errors (migration not
// applied yet, transient DB issue), the request is allowed rather than
// rejected. It's a cost/abuse guard, not a security boundary, so availability
// wins over strictness here.
export async function withinRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  try {
    const { data, error } = await admin().rpc("check_rate_limit", {
      p_key: key,
      p_window_seconds: windowSeconds,
      p_limit: limit,
    });
    if (error) {
      console.warn("Rate limit check failed, allowing request", error);
      return true;
    }
    return Boolean(data);
  } catch (e) {
    console.warn("Rate limit check threw, allowing request", e);
    return true;
  }
}
