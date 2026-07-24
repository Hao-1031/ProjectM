import { describe, it, expect } from "vitest";
import {
  generateState,
  hashState,
  deriveBridgePassword,
  buildLarkAuthorizeUrl,
} from "./lark";

describe("lark auth helpers", () => {
  it("generateState produces a 64-character hex string", () => {
    const state = generateState();
    expect(state).toMatch(/^[a-f0-9]{64}$/);
  });

  it("generateState produces unique values", () => {
    const a = generateState();
    const b = generateState();
    expect(a).not.toBe(b);
  });

  it("hashState returns a deterministic sha256 hex", () => {
    const state = "test-state";
    const hashA = hashState(state);
    const hashB = hashState(state);
    expect(hashA).toBe(hashB);
    expect(hashA).toMatch(/^[a-f0-9]{64}$/);
  });

  it("deriveBridgePassword is deterministic and depends on secret", () => {
    const openId = "ou_123";
    const secret = "secret-a";
    const pwA = deriveBridgePassword(openId, secret);
    const pwB = deriveBridgePassword(openId, secret);
    const pwC = deriveBridgePassword(openId, "secret-b");
    expect(pwA).toBe(pwB);
    expect(pwA).not.toBe(pwC);
    expect(pwA).toMatch(/^[a-f0-9]{64}$/);
  });

  it("buildLarkAuthorizeUrl includes app_id, redirect_uri and state", () => {
    const url = buildLarkAuthorizeUrl({
      appId: "app_123",
      redirectUri: "https://example.com/callback",
      state: "hashed-state",
    });
    const parsed = new URL(url);
    expect(parsed.origin).toBe("https://open.feishu.cn");
    expect(parsed.pathname).toBe("/open-apis/authen/v1/authorize");
    expect(parsed.searchParams.get("app_id")).toBe("app_123");
    expect(parsed.searchParams.get("redirect_uri")).toBe("https://example.com/callback");
    expect(parsed.searchParams.get("state")).toBe("hashed-state");
  });
});
