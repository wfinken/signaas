export interface Env {
  /** Canonical public origin, e.g. "https://signaas.cc". */
  PUBLIC_ORIGIN?: string;
  /** Free-tier request allowance per IP per hour. Defaults to 100. */
  RATE_LIMIT?: string;
  /** Comma separated paid-tier API keys. Set with `wrangler secret put API_KEYS`. */
  API_KEYS?: string;
  /** Optional. Bind a KV namespace to turn on free-tier rate limiting. */
  RATE_LIMIT_KV?: KVNamespace;
}
