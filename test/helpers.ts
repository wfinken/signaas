import worker from "../src/index";
import type { Env } from "../src/env";

export const EMPTY_ENV: Env = {};

/**
 * An execution context that remembers what was handed to waitUntil, so a test
 * can wait for the after-response work before asserting on it.
 */
export function context() {
  const pending: Promise<unknown>[] = [];
  const ctx = {
    waitUntil: (promise: Promise<unknown>) => void pending.push(promise),
    passThroughOnException: () => undefined,
  } as unknown as ExecutionContext;
  return { ctx, settled: () => Promise.all(pending) };
}

export function get(
  path: string,
  init: RequestInit = {},
  env: Env = EMPTY_ENV,
  ctx: ExecutionContext = context().ctx,
) {
  const request = new Request("https://signaas.cc" + path, { method: "GET", ...init });
  return worker.fetch(request, env, ctx);
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

/**
 * Minimal in-memory stand-in for a D1 database, enough for the counter. It
 * recognises the three statements the counter uses and behaves like SQLite
 * about a table that does not exist yet.
 */
export function memoryD1(options: { table?: boolean; broken?: boolean; served?: number } = {}) {
  const rows = new Map<string, number>();
  let table = options.table ?? options.served !== undefined;
  if (options.served !== undefined) rows.set("signatures", options.served);
  const statements: string[] = [];

  async function execute(sql: string, values: unknown[]): Promise<{ value: number } | null> {
    statements.push(sql);
    if (options.broken) throw new Error("D1_ERROR: the database is unreachable");
    if (sql.startsWith("CREATE TABLE")) {
      table = true;
      return null;
    }
    if (!table) throw new Error("D1_ERROR: no such table: counters: SQLITE_ERROR");
    const name = String(values[0]);
    if (sql.startsWith("INSERT INTO counters")) {
      rows.set(name, (rows.get(name) ?? 0) + 1);
      return null;
    }
    if (sql.startsWith("SELECT value FROM counters")) {
      return rows.has(name) ? { value: rows.get(name)! } : null;
    }
    throw new Error("memoryD1 does not understand: " + sql);
  }

  function statement(sql: string, values: unknown[] = []) {
    return {
      bind: (...bound: unknown[]) => statement(sql, bound),
      first: () => execute(sql, values),
      run: async () => {
        await execute(sql, values);
        return { success: true, results: [], meta: {} };
      },
    };
  }

  return {
    db: { prepare: (sql: string) => statement(sql) } as unknown as D1Database,
    statements,
    hasTable: () => table,
    served: () => rows.get("signatures") ?? 0,
  };
}
