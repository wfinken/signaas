import { CATEGORIES, findCategory, normalizeSlug, TOTAL_TEMPLATES } from "./categories";
import { canonicalOrigin } from "./config";
import { countSignature, signaturesServed } from "./counter";
import type { Env } from "./env";
import { CONTENT_TYPES, negotiateFormat, type Format } from "./negotiate";
import { renderHomepage } from "./home";
import { openApiDocument } from "./openapi";
import { checkRateLimit, rateLimitHeaders, type RateLimitResult } from "./ratelimit";
import { buildSignature, toHtml, toJson, toText } from "./signature";
import { escapeHtml } from "./sanitize";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Accept, Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
};

function respond(
  body: string,
  init: { status?: number; format?: Format; cache?: string; headers?: Record<string, string> } = {},
): Response {
  const format = init.format ?? "json";
  return new Response(body, {
    status: init.status ?? 200,
    headers: {
      "Content-Type": CONTENT_TYPES[format],
      "Cache-Control": init.cache ?? "no-store",
      Vary: "Accept",
      ...CORS_HEADERS,
      ...init.headers,
    },
  });
}

function json(value: unknown, init: Parameters<typeof respond>[1] = {}): Response {
  return respond(JSON.stringify(value, null, 2), { ...init, format: "json" });
}

/** Renders an error in whichever format the caller asked for. */
function fail(
  status: number,
  error: string,
  message: string,
  format: Format,
  extra: Record<string, unknown> = {},
  headers: Record<string, string> = {},
): Response {
  if (format === "text") {
    return respond(error + ": " + message + "\n", { status, format, headers });
  }
  if (format === "html") {
    const body =
      "<p><strong>" + escapeHtml(error) + "</strong></p>\n<p>" + escapeHtml(message) + "</p>";
    return respond(body, { status, format, headers });
  }
  return json({ error, message, ...extra }, { status, headers });
}

function serviceIndex(origin: string): unknown {
  return {
    name: "SignaaS",
    tagline: "Signature as a Service",
    endpoints: {
      signature: origin + "/:category/:name",
      random: origin + "/random/:name",
      categories: origin + "/categories",
      openapi: origin + "/openapi.json",
      health: origin + "/health",
    },
    query_parameters: ["title", "company", "recipient", "format", "seed"],
    formats: ["application/json", "text/plain", "text/html"],
    categories: CATEGORIES.map((category) => category.slug),
    documentation: origin + "/",
  };
}

function categoryCatalogue(origin: string): unknown {
  return {
    count: CATEGORIES.length,
    categories: CATEGORIES.map((category) => ({
      slug: category.slug,
      name: category.name,
      description: category.description,
      aliases: category.aliases,
      templates: category.templates.length,
      url: origin + "/" + category.slug + "/:name",
    })),
  };
}

function renderSignature(
  slug: string,
  rawName: string,
  url: URL,
  format: Format,
  headers: Record<string, string>,
): Response {
  const category =
    slug === "random"
      ? CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]!
      : findCategory(slug);

  if (!category) {
    return fail(
      404,
      "unknown_category",
      "No such category: " + normalizeSlug(slug),
      format,
      { categories: CATEGORIES.map((entry) => entry.slug) },
      headers,
    );
  }

  const params = url.searchParams;
  const signature = buildSignature(
    category,
    {
      name: rawName,
      title: params.get("title") ?? "",
      company: params.get("company") ?? "",
      recipient: params.get("recipient") ?? params.get("to") ?? "",
    },
    params.get("seed") ?? undefined,
  );

  if (!signature.fields.name) {
    return fail(400, "invalid_name", "The :name segment must contain at least one usable character.", format, {}, headers);
  }

  // A seeded request is deterministic, so it is safe to cache at the edge.
  const cache = params.get("seed") ? "public, max-age=86400" : "no-store";
  const withCategory = { ...headers, "X-Signaas-Category": category.slug };

  if (format === "text") {
    return respond(toText(signature) + "\n", { format, cache, headers: withCategory });
  }
  if (format === "html") {
    return respond(toHtml(signature), { format, cache, headers: withCategory });
  }
  return respond(JSON.stringify(toJson(signature), null, 2), {
    format: "json",
    cache,
    headers: withCategory,
  });
}

/** Path segments, percent-decoded, with empty segments dropped. */
function segments(pathname: string): string[] {
  return pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    });
}

async function handle(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const origin = url.origin;
  const canonical = canonicalOrigin(env.PUBLIC_ORIGIN);
  const format = negotiateFormat(request, url);
  const path = segments(url.pathname);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    return fail(405, "method_not_allowed", "SignaaS is read-only. Use GET.", format, {}, {
      Allow: "GET, HEAD, OPTIONS",
    });
  }

  if (path.length === 0) {
    if (format === "html") {
      return respond(renderHomepage(origin, canonical, await signaturesServed(env.DB)), {
        format: "html",
        cache: "public, max-age=300",
      });
    }
    if (format === "text") {
      return respond(
        "SignaaS - Signature as a Service\nGET " + origin + "/:category/:name\nCategories: " +
          CATEGORIES.map((category) => category.slug).join(", ") + "\n",
        { format, cache: "public, max-age=300" },
      );
    }
    return json(serviceIndex(origin), { cache: "public, max-age=300" });
  }

  const [first, second] = path;

  if (path.length === 1) {
    switch (first) {
      case "health":
        return json({
          status: "ok",
          categories: CATEGORIES.length,
          tones: CATEGORIES.length,
          templates: TOTAL_TEMPLATES,
          served: await signaturesServed(env.DB),
        });
      case "categories":
        return json(categoryCatalogue(origin), { cache: "public, max-age=3600" });
      case "openapi.json":
        return json(openApiDocument(origin, canonical), { cache: "public, max-age=3600" });
      case "robots.txt":
        return respond("User-agent: *\nAllow: /\n", { format: "text", cache: "public, max-age=86400" });
      case "favicon.ico":
        return new Response(null, { status: 204, headers: CORS_HEADERS });
      default:
        break;
    }
  }

  if (path.length === 1 && (first === "random" || findCategory(first!))) {
    return fail(
      400,
      "missing_name",
      "Add a name: " + origin + "/" + first + "/Ada",
      format,
    );
  }

  if (path.length === 2) {
    const limit = await checkRateLimit(request, env);
    const headers = rateLimitHeaders(limit);
    if (!limit.allowed) return tooManyRequests(limit, format, headers);
    const response = renderSignature(first!, second!, url, format, headers);
    // Count it after the response is on its way; the tally never delays a signature.
    if (response.ok && env.DB) ctx.waitUntil(countSignature(env.DB));
    return response;
  }

  return fail(404, "not_found", "Nothing here. Try " + origin + "/funny/Ada", format, {
    endpoints: [origin + "/:category/:name", origin + "/categories", origin + "/openapi.json"],
  });
}

function tooManyRequests(
  limit: RateLimitResult,
  format: Format,
  headers: Record<string, string>,
): Response {
  const retryAfter = Math.max(1, limit.reset - Math.floor(Date.now() / 1000));
  return fail(
    429,
    "rate_limited",
    "Free tier allows " + limit.limit + " requests per hour. Retry in " + retryAfter + "s, or use an API key.",
    format,
    { limit: limit.limit, reset: limit.reset },
    { ...headers, "Retry-After": String(retryAfter) },
  );
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const response = await handle(request, env, ctx);
      // HEAD must not carry a body, but should keep the headers of the GET.
      return request.method === "HEAD" ? new Response(null, response) : response;
    } catch (error) {
      console.error("signaas: unhandled error", error);
      return json(
        { error: "internal_error", message: "The signature machine jammed. Try again." },
        { status: 500 },
      );
    }
  },
} satisfies ExportedHandler<Env>;
