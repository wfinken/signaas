import worker from "../src/index";
import type { Env } from "../src/env";

export const EMPTY_ENV: Env = {};

export function get(path: string, init: RequestInit = {}, env: Env = EMPTY_ENV) {
  const request = new Request("https://signaas.cc" + path, { method: "GET", ...init });
  return worker.fetch(request, env);
}

/** Minimal in-memory stand-in for a KV namespace, enough for the rate limiter. */
export function memoryKv() {
  const store = new Map<string, string>();
  return {
    store,
    kv: {
      get: async (key: string) => store.get(key) ?? null,
      put: async (key: string, value: string) => void store.set(key, value),
    } as unknown as KVNamespace,
  };
}
