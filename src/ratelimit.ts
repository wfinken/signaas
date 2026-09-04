import type { Env } from "./env";

export interface RateLimitResult {
  /** False when the caller has exhausted the window. */
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Unix seconds at which the current window rolls over. */
  reset: number;
  /** True for API key holders and when no KV namespace is bound. */
  unlimited: boolean;
}

const WINDOW_SECONDS = 3600;
const DEFAULT_LIMIT = 100;

function parseKeys(raw: string | undefined): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((key) => key.trim())
      .filter(Boolean),
  );
}

/** Extracts the bearer token (or raw key) from an Authorization header. */
export function extractApiKey(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^bearer\s+(.+)$/i.exec(header.trim());
  return (match?.[1] ?? header).trim() || null;
}

export function isPaidKey(request: Request, env: Env): boolean {
  const key = extractApiKey(request);
  if (!key) return false;
  return parseKeys(env.API_KEYS).has(key);
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/**
 * Fixed-window counter in KV: one key per IP per hour, expiring with the
 * window. KV is eventually consistent, so a burst across colos can slip a few
 * requests past the limit; that is an acceptable trade for a free tier that
 * costs one read and one write per request.
 *
 * When no RATE_LIMIT_KV binding exists the API stays open and simply reports
 * itself as unlimited, so a fresh `wrangler deploy` works with no setup.
 */
export async function checkRateLimit(request: Request, env: Env): Promise<RateLimitResult> {
  const limit = Number.parseInt(env.RATE_LIMIT ?? "", 10) || DEFAULT_LIMIT;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % WINDOW_SECONDS);
  const reset = windowStart + WINDOW_SECONDS;

  if (isPaidKey(request, env) || !env.RATE_LIMIT_KV) {
    return { allowed: true, limit, remaining: limit, reset, unlimited: true };
  }

  const key = "rl:" + clientIp(request) + ":" + windowStart;
  const current = Number.parseInt((await env.RATE_LIMIT_KV.get(key)) ?? "0", 10) || 0;

  if (current >= limit) {
    return { allowed: false, limit, remaining: 0, reset, unlimited: false };
  }

  await env.RATE_LIMIT_KV.put(key, String(current + 1), {
    expirationTtl: Math.max(60, reset - now),
  });

  return { allowed: true, limit, remaining: Math.max(0, limit - current - 1), reset, unlimited: false };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  if (result.unlimited) return {};
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.reset),
  };
}
