import crypto from "crypto";

// These two secrets are intentionally separate from SUPABASE_SERVICE_ROLE_KEY.
// Encryption key and OAuth-state signing key must each be dedicated values so
// that a leak of any one secret (service role, encryption key, state key)
// does not also compromise the other two. Set them in Vercel:
//   CREDENTIALS_ENCRYPTION_KEY  -> openssl rand -base64 32
//   OAUTH_STATE_SECRET          -> openssl rand -base64 32
function key() {
  const source = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!source) throw new Error("CREDENTIALS_ENCRYPTION_KEY_REQUIRED");
  return crypto.createHash("sha256").update(source).digest();
}
function oauthStateSecret() {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret) throw new Error("OAUTH_STATE_SECRET_REQUIRED");
  return secret;
}

export function encryptCredentials(value: unknown) {
  const iv = crypto.randomBytes(12), cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}
export function decryptCredentials<T = any>(payload: string): T {
  const [version, iv, tag, data] = payload.split(".");
  if (version !== "v1" || !iv || !tag || !data) throw new Error("INVALID_CREDENTIAL_PAYLOAD");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8"));
}
export function signState(value: object) {
  const body = Buffer.from(JSON.stringify(value)).toString("base64url");
  const sig = crypto.createHmac("sha256", oauthStateSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}
export function verifyState<T = any>(state: string): T {
  const [body, sig] = state.split(".");
  if (!body || !sig) throw new Error("INVALID_OAUTH_STATE");
  const expected = crypto.createHmac("sha256", oauthStateSecret()).update(body).digest("base64url");
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    throw new Error("INVALID_OAUTH_STATE");
  }
  const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (!parsed.exp || Date.now() > parsed.exp) throw new Error("OAUTH_STATE_EXPIRED");
  return parsed;
}
