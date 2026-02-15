// Simple in-memory rate limiter for API routes
// Uses a sliding window approach per IP address

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp ms
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 60_000; // 1 minute
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  maxRequests: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given key (typically IP + route).
 * Returns whether the request is allowed and remaining quota.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  // No entry or window expired — fresh start
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  // Within window — increment
  entry.count += 1;

  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

// --- Preset configurations ---

/** AI chat routes — 20 requests per minute */
export const AI_CHAT_LIMIT: RateLimitConfig = {
  maxRequests: 20,
  windowMs: 60_000,
};

/** AI extraction / scoring routes — 30 requests per minute */
export const AI_EXTRACTION_LIMIT: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 60_000,
};

/** Briefing generation — 5 per minute (expensive) */
export const BRIEFING_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 60_000,
};

/** Standard CRUD routes — 60 requests per minute */
export const STANDARD_LIMIT: RateLimitConfig = {
  maxRequests: 60,
  windowMs: 60_000,
};

// --- Next.js helper ---

import { NextRequest, NextResponse } from "next/server";

/**
 * Apply rate limiting to a Next.js API route.
 * Returns a 429 response if limit is exceeded, or null if allowed.
 */
export function applyRateLimit(
  request: NextRequest,
  routeName: string,
  config: RateLimitConfig
): NextResponse | null {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const key = `${ip}:${routeName}`;
  const result = checkRateLimit(key, config);

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(config.maxRequests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
        },
      }
    );
  }

  return null; // Allowed
}
