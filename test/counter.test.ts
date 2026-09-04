import { describe, expect, it, vi } from "vitest";
import { context, get, memoryD1 } from "./helpers";

async function hit(path: string, db: D1Database, headers: Record<string, string> = {}) {
  const { ctx, settled } = context();
  const response = await get(path, { headers }, { DB: db }, ctx);
  await settled();
  return response;
}

describe("the signatures-served tally", () => {
  it("adds one for every signature served", async () => {
    const d1 = memoryD1({ table: true });
    await hit("/pirate/Ada", d1.db);
    await hit("/random/Ada", d1.db);
    await hit("/business/Ada?title=VP", d1.db, { accept: "text/html" });
    expect(d1.served()).toBe(3);
  });

  it("reports the tally on /health and in the hero", async () => {
    const d1 = memoryD1({ served: 12345 });
    const health = (await (await hit("/health", d1.db)).json()) as { served: number };
    expect(health.served).toBe(12345);

    const page = await (await hit("/", d1.db, { accept: "text/html" })).text();
    expect(page).toContain('<b id="served">12,345</b> signatures served');
    expect(page).toMatch(
      /<h1>Sign off with exactly the energy the moment deserves\.<\/h1>\s*<p class="served"><span class="dot"><\/span><b id="served">12,345<\/b> signatures served<\/p>/,
    );
  });

  it("does not count anything that is not a signature", async () => {
    const d1 = memoryD1({ table: true });
    await hit("/", d1.db, { accept: "text/html" });
    await hit("/health", d1.db);
    await hit("/categories", d1.db);
    await hit("/openapi.json", d1.db);
    expect(d1.served()).toBe(0);
  });

  it("does not count a request that got no signature", async () => {
    const d1 = memoryD1({ table: true });
    await hit("/no-such-tone/Ada", d1.db);
    await hit("/pirate", d1.db);
    await hit("/pirate/%E2%80%8B", d1.db);
    expect(d1.served()).toBe(0);
  });

  it("creates its table the first time it needs it", async () => {
    const d1 = memoryD1();
    expect(d1.hasTable()).toBe(false);
    await hit("/pirate/Ada", d1.db);
    expect(d1.hasTable()).toBe(true);
    expect(d1.served()).toBe(1);
    expect(d1.statements.some((sql) => sql.startsWith("CREATE TABLE IF NOT EXISTS"))).toBe(true);
  });

  it("reads a bound but empty database as zero", async () => {
    const d1 = memoryD1();
    const health = (await (await hit("/health", d1.db)).json()) as { served: number | null };
    expect(health.served).toBe(0);
  });

  it("leaves the line out and reports null when nothing is bound", async () => {
    const page = await (await get("/", { headers: { accept: "text/html" } })).text();
    expect(page).not.toContain("signatures served");

    const health = (await (await get("/health")).json()) as { served: number | null };
    expect(health.served).toBeNull();
  });

  it("keeps serving signatures when the database is unreachable", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      const d1 = memoryD1({ broken: true });
      const signature = await hit("/pirate/Ada", d1.db);
      expect(signature.status).toBe(200);

      const page = await (await hit("/", d1.db, { accept: "text/html" })).text();
      expect(page).not.toContain("signatures served");

      const health = (await (await hit("/health", d1.db)).json()) as { served: number | null };
      expect(health.served).toBeNull();

      // Swallowed for the caller, but never silently: each failure is logged.
      expect(warn).toHaveBeenCalledTimes(3);
    } finally {
      warn.mockRestore();
    }
  });
});
