import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decryptCredentials, encryptCredentials, signState, verifyState } from "./credentials";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env.CREDENTIALS_ENCRYPTION_KEY = "test-encryption-key-do-not-use-in-prod";
  process.env.OAUTH_STATE_SECRET = "test-oauth-state-secret-do-not-use-in-prod";
});
afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("credential encryption", () => {
  it("round-trips arbitrary JSON-serializable values", () => {
    const value = { access_token: "abc", refresh_token: "xyz", expires_at: 123456789 };
    const encrypted = encryptCredentials(value);
    expect(decryptCredentials(encrypted)).toEqual(value);
  });

  it("throws if CREDENTIALS_ENCRYPTION_KEY is not set, instead of silently reusing another secret", () => {
    delete process.env.CREDENTIALS_ENCRYPTION_KEY;
    expect(() => encryptCredentials({ a: 1 })).toThrow("CREDENTIALS_ENCRYPTION_KEY_REQUIRED");
  });

  it("rejects a tampered payload (authentication tag mismatch)", () => {
    const encrypted = encryptCredentials({ a: 1 });
    const parts = encrypted.split(".");
    parts[3] = Buffer.from("tampered-ciphertext").toString("base64url");
    expect(() => decryptCredentials(parts.join("."))).toThrow();
  });
});

describe("OAuth state signing", () => {
  it("round-trips and validates an unexpired state", () => {
    const state = signState({ provider: "gmail", restaurantId: "r1", exp: Date.now() + 60_000 });
    expect(verifyState(state)).toMatchObject({ provider: "gmail", restaurantId: "r1" });
  });

  it("rejects an expired state", () => {
    const state = signState({ provider: "gmail", exp: Date.now() - 1000 });
    expect(() => verifyState(state)).toThrow("OAUTH_STATE_EXPIRED");
  });

  it("rejects a state signed with a different secret", () => {
    const state = signState({ provider: "gmail", exp: Date.now() + 60_000 });
    process.env.OAUTH_STATE_SECRET = "a-completely-different-secret";
    expect(() => verifyState(state)).toThrow("INVALID_OAUTH_STATE");
  });

  it("throws if OAUTH_STATE_SECRET is not set, instead of silently reusing another secret", () => {
    delete process.env.OAUTH_STATE_SECRET;
    expect(() => signState({ provider: "gmail" })).toThrow("OAUTH_STATE_SECRET_REQUIRED");
  });
});
