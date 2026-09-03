import { describe, expect, it } from "vitest";
import { CATEGORIES } from "../src/categories";
import { get, memoryKv } from "./helpers";

describe("signature endpoint", () => {
  it("returns JSON by default", async () => {
    const response = await get("/passive-aggressive/Alice");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");

    const body = (await response.json()) as { message: string; subtitle: string };
    expect(Object.keys(body).sort()).toEqual(["message", "subtitle"]);
    expect(body.message.length).toBeGreaterThan(0);
    expect(body.subtitle).toBe("— Alice");
  });

  it("honours Accept: text/plain", async () => {
    const response = await get("/pirate/Blackbeard", { headers: { accept: "text/plain" } });
    const body = await response.text();
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(body.trim().split("\n")).toHaveLength(2);
    expect(body).toContain("Cap'n Blackbeard");
  });

  it("honours Accept: text/html and renders the optional title", async () => {
    const response = await get("/business/John?title=VP%20of%20Sales", {
      headers: { accept: "text/html" },
    });
    const body = await response.text();
    expect(body).toMatch(/^<p>.*<\/p>\n<p><strong>John<\/strong><br\/><em>VP of Sales<\/em><\/p>$/s);
  });

  it("prefers the highest q-value the client offers", async () => {
    const response = await get("/funny/Ada", {
      headers: { accept: "text/html;q=0.4, text/plain;q=0.9" },
    });
    expect(response.headers.get("content-type")).toContain("text/plain");
  });

  it("lets ?format override the Accept header", async () => {
    const response = await get("/funny/Ada?format=json", { headers: { accept: "text/html" } });
    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("is deterministic for a given seed", async () => {
    const first = await (await get("/mad/Ada?seed=abc")).json();
    const second = await (await get("/mad/Ada?seed=abc")).json();
    expect(first).toEqual(second);
  });

  it("appends title and company to the attribution", async () => {
    const response = await get("/normal/Ada?title=CTO&company=Initech&seed=1");
    const body = (await response.json()) as { subtitle: string };
    expect(body.subtitle).toBe("— Ada, CTO, Initech");
  });

  it("serves every category and alias", async () => {
    for (const category of CATEGORIES) {
      for (const slug of [category.slug, ...category.aliases]) {
        const response = await get("/" + slug + "/Ada");
        expect(response.status, slug).toBe(200);
        expect(response.headers.get("x-signaas-category")).toBe(category.slug);
      }
    }
  });

  it("never leaves an unresolved placeholder", async () => {
    for (const category of CATEGORIES) {
      for (let seed = 0; seed < category.templates.length * 4; seed++) {
        const response = await get("/" + category.slug + "/Ada?seed=s" + seed);
        const body = (await response.json()) as { message: string; subtitle: string };
        expect(body.message + body.subtitle, category.slug).not.toMatch(/[{}]/);
      }
    }
  });

  it("404s an unknown category with the list of valid ones", async () => {
    const response = await get("/nonsense/Ada");
    expect(response.status).toBe(404);
    const body = (await response.json()) as { error: string; categories: string[] };
    expect(body.error).toBe("unknown_category");
    expect(body.categories).toContain("pirate");
  });

  it("asks for a name when only a category is given", async () => {
    const response = await get("/pirate");
    expect(response.status).toBe(400);
    expect(((await response.json()) as { error: string }).error).toBe("missing_name");
  });

  it("rejects a name that sanitizes to nothing", async () => {
    const response = await get("/normal/%E2%80%8B");
    expect(response.status).toBe(400);
    expect(((await response.json()) as { error: string }).error).toBe("invalid_name");
  });

  it("routes /random to a real category", async () => {
    const response = await get("/random/Ada");
    expect(response.status).toBe(200);
    const slug = response.headers.get("x-signaas-category");
    expect(CATEGORIES.some((category) => category.slug === slug)).toBe(true);
  });
});

describe("service endpoints", () => {
  it("serves the homepage to browsers", async () => {
    const response = await get("/", { headers: { accept: "text/html,application/xhtml+xml" } });
    const body = await response.text();
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(body).toContain("Signature as a Service");
    expect(body).toContain('id="category"');
  });

  it("carries the design system the homepage is built on", async () => {
    const response = await get("/", { headers: { accept: "text/html" } });
    const body = await response.text();
    // Two typefaces, one muted accent, and none of the generated-template tells.
    expect(body).toContain("DM Sans");
    expect(body).toContain("Fira Code");
    expect(body).toContain("--accent: #9d5b3f");
    expect(body).not.toContain("linear-gradient");
  });

  it("softens its geometry without floating", async () => {
    const response = await get("/", { headers: { accept: "text/html" } });
    const body = await response.text();
    const lengths = (rules: RegExpMatchArray | null) =>
      (rules ?? []).flatMap((rule) => rule.match(/\d+(?=px)/g) ?? []).map(Number);

    // Just the sharp edge taken off: 6px, never a pill or a rounded card.
    expect(lengths(body.match(/border-radius:[^;]*/g)).filter((value) => value > 6)).toEqual([]);

    // Depth only ever separates layers, so every shadow stays nearly invisible.
    const opacities = (body.match(/(?:--|box-)shadow:[^;]*/g) ?? [])
      .flatMap((rule) => rule.match(/0\.\d+(?=\))/g) ?? [])
      .map(Number);
    expect(opacities.length).toBeGreaterThan(0);
    expect(Math.max(...opacities)).toBeLessThanOrEqual(0.25);
  });

  it("moves gently rather than snapping", async () => {
    const response = await get("/", { headers: { accept: "text/html" } });
    const body = await response.text();
    expect(body).toContain("--ease: 150ms ease-in-out");
    expect(body).not.toContain("transition: none");
  });

  it("keeps its empty and failure states conversational", async () => {
    const response = await get("/", { headers: { accept: "text/html" } });
    const body = await response.text();
    expect(body).toContain("It's a little quiet in here right now.");
    expect(body).toContain("give it another go");
  });

  it("serves a JSON index to API clients", async () => {
    const response = await get("/", { headers: { accept: "application/json" } });
    const body = (await response.json()) as { categories: string[] };
    expect(body.categories).toHaveLength(CATEGORIES.length);
  });

  it("lists categories", async () => {
    const response = await get("/categories");
    const body = (await response.json()) as { count: number; categories: unknown[] };
    expect(body.count).toBe(CATEGORIES.length);
    expect(body.categories).toHaveLength(CATEGORIES.length);
  });

  it("describes itself with OpenAPI", async () => {
    const response = await get("/openapi.json");
    const body = (await response.json()) as { openapi: string; paths: Record<string, unknown> };
    expect(body.openapi).toBe("3.1.0");
    expect(body.paths["/{category}/{name}"]).toBeDefined();
  });

  it("answers health checks", async () => {
    expect((await get("/health")).status).toBe(200);
  });

  it("advertises the production domain as canonical", async () => {
    const response = await get("/", { headers: { accept: "text/html" } });
    const body = await response.text();
    expect(body).toContain('<link rel="canonical" href="https://signaas.cc/"/>');
    expect(body).toContain('<meta property="og:url" content="https://signaas.cc/"/>');
  });

  it("lists the production server in the OpenAPI document", async () => {
    const response = await get("/openapi.json");
    const body = (await response.json()) as { servers: { url: string }[] };
    expect(body.servers[0]?.url).toBe("https://signaas.cc");
  });

  it("lets PUBLIC_ORIGIN override the canonical origin", async () => {
    const response = await get("/openapi.json", {}, { PUBLIC_ORIGIN: "https://staging.signaas.cc/" });
    const body = (await response.json()) as { servers: { url: string }[] };
    expect(body.servers.map((server) => server.url)).toEqual([
      "https://staging.signaas.cc",
      "https://signaas.cc",
    ]);
  });
});

describe("http semantics", () => {
  it("sets permissive CORS headers", async () => {
    const response = await get("/funny/Ada");
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("answers preflight requests", async () => {
    const response = await get("/funny/Ada", { method: "OPTIONS" });
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-methods")).toContain("GET");
  });

  it("rejects writes", async () => {
    const response = await get("/funny/Ada", { method: "POST" });
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toContain("GET");
  });

  it("returns headers but no body for HEAD", async () => {
    const response = await get("/funny/Ada", { method: "HEAD" });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("");
  });

  it("varies on Accept", async () => {
    expect((await get("/funny/Ada")).headers.get("vary")).toBe("Accept");
  });
});

describe("rate limiting", () => {
  it("is disabled when no KV namespace is bound", async () => {
    const response = await get("/funny/Ada");
    expect(response.headers.get("x-ratelimit-limit")).toBeNull();
  });

  it("counts down and then returns 429", async () => {
    const { kv } = memoryKv();
    const env = { RATE_LIMIT: "3", RATE_LIMIT_KV: kv };
    const headers = { "cf-connecting-ip": "203.0.113.9" };

    const first = await get("/funny/Ada", { headers }, env);
    expect(first.headers.get("x-ratelimit-limit")).toBe("3");
    expect(first.headers.get("x-ratelimit-remaining")).toBe("2");

    await get("/funny/Ada", { headers }, env);
    await get("/funny/Ada", { headers }, env);

    const blocked = await get("/funny/Ada", { headers }, env);
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(((await blocked.json()) as { error: string }).error).toBe("rate_limited");
  });

  it("counts each IP separately", async () => {
    const { kv } = memoryKv();
    const env = { RATE_LIMIT: "1", RATE_LIMIT_KV: kv };

    await get("/funny/Ada", { headers: { "cf-connecting-ip": "198.51.100.1" } }, env);
    const other = await get("/funny/Ada", { headers: { "cf-connecting-ip": "198.51.100.2" } }, env);
    expect(other.status).toBe(200);
  });

  it("lets a valid API key bypass the limit", async () => {
    const { kv } = memoryKv();
    const env = { RATE_LIMIT: "1", RATE_LIMIT_KV: kv, API_KEYS: "key-one, key-two" };
    const headers = { "cf-connecting-ip": "203.0.113.10", authorization: "Bearer key-two" };

    for (let i = 0; i < 5; i++) {
      expect((await get("/funny/Ada", { headers }, env)).status).toBe(200);
    }
  });
});
