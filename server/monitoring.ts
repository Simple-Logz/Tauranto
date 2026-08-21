// Minimal error reporting wrapper around @sentry/node. Every function here is
// a safe no-op until SENTRY_DSN is set in Vercel — nothing breaks or changes
// behavior for a deploy that hasn't configured monitoring yet, and no Sentry
// account is required to ship this code; it activates the moment a real DSN
// is added. Centralizing it here (rather than importing Sentry directly in
// every API route) keeps the rest of the codebase provider-agnostic.
import * as Sentry from "@sentry/node";

let initialized = false;

function ensureInit() {
  if (initialized) return Boolean(process.env.SENTRY_DSN);
  const dsn = process.env.SENTRY_DSN;
  if (dsn) {
    try {
      Sentry.init({ dsn, environment: process.env.EXPO_PUBLIC_APP_ENV || "production", tracesSampleRate: 0 });
    } catch (e) {
      console.warn("Sentry could not be initialized", e);
    }
  }
  initialized = true;
  return Boolean(dsn);
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (!ensureInit()) return;
  try {
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), context ? { extra: context } : undefined);
  } catch (e) {
    console.warn("Sentry captureException failed", e);
  }
}
