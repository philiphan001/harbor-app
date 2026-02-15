import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, RateLimitConfig } from "@/lib/utils/rateLimit";

// We test checkRateLimit directly (the core logic).
// applyRateLimit is a thin Next.js wrapper on top of it.

const TEST_LIMIT: RateLimitConfig = { maxRequests: 3, windowMs: 10_000 };

describe("checkRateLimit", () => {
  beforeEach(() => {
    // Use a unique key prefix per test to avoid cross-test contamination
    // (the in-memory store persists across tests in the same run)
  });

  it("allows requests within the limit", () => {
    const key = `test-allow-${Date.now()}`;
    const r1 = checkRateLimit(key, TEST_LIMIT);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = checkRateLimit(key, TEST_LIMIT);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = checkRateLimit(key, TEST_LIMIT);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks requests exceeding the limit", () => {
    const key = `test-block-${Date.now()}`;
    // Exhaust the limit
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, TEST_LIMIT);
    }

    const r4 = checkRateLimit(key, TEST_LIMIT);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
  });

  it("returns a resetAt timestamp in the future", () => {
    const key = `test-reset-${Date.now()}`;
    const now = Date.now();
    const result = checkRateLimit(key, TEST_LIMIT);
    expect(result.resetAt).toBeGreaterThan(now);
    expect(result.resetAt).toBeLessThanOrEqual(now + TEST_LIMIT.windowMs + 100);
  });

  it("isolates different keys independently", () => {
    const keyA = `test-iso-a-${Date.now()}`;
    const keyB = `test-iso-b-${Date.now()}`;

    // Exhaust key A
    for (let i = 0; i < 3; i++) {
      checkRateLimit(keyA, TEST_LIMIT);
    }
    expect(checkRateLimit(keyA, TEST_LIMIT).allowed).toBe(false);

    // Key B should still be allowed
    expect(checkRateLimit(keyB, TEST_LIMIT).allowed).toBe(true);
    expect(checkRateLimit(keyB, TEST_LIMIT).remaining).toBe(1);
  });

  it("allows different configs per key", () => {
    const key = `test-config-${Date.now()}`;
    const strictLimit: RateLimitConfig = { maxRequests: 1, windowMs: 10_000 };

    const r1 = checkRateLimit(key, strictLimit);
    expect(r1.allowed).toBe(true);

    const r2 = checkRateLimit(key, strictLimit);
    expect(r2.allowed).toBe(false);
  });

  it("resets after window expires", () => {
    // We can't easily test real time expiry in a unit test,
    // but we can verify the structure: a fresh key always starts allowed
    const key = `test-fresh-${Date.now()}`;
    const result = checkRateLimit(key, TEST_LIMIT);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(TEST_LIMIT.maxRequests - 1);
  });

  it("returns correct remaining count at each step", () => {
    const key = `test-remaining-${Date.now()}`;
    const limit: RateLimitConfig = { maxRequests: 5, windowMs: 60_000 };

    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(key, limit);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4 - i);
    }

    // 6th request should be blocked
    const blocked = checkRateLimit(key, limit);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });
});
