export type Format = "json" | "text" | "html";

const FORMAT_ALIASES: Record<string, Format> = {
  json: "json",
  "application/json": "json",
  text: "text",
  txt: "text",
  plain: "text",
  "text/plain": "text",
  html: "html",
  "text/html": "html",
};

export const CONTENT_TYPES: Record<Format, string> = {
  json: "application/json; charset=utf-8",
  text: "text/plain; charset=utf-8",
  html: "text/html; charset=utf-8",
};

interface AcceptEntry {
  type: string;
  quality: number;
  order: number;
}

function parseAccept(header: string): AcceptEntry[] {
  return header
    .split(",")
    .map((part, order) => {
      const [rawType = "", ...params] = part.trim().split(";");
      const qParam = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const quality = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
      return {
        type: rawType.trim().toLowerCase(),
        quality: Number.isFinite(quality) ? quality : 0,
        order,
      };
    })
    .filter((entry) => entry.type !== "" && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality || a.order - b.order);
}

/**
 * Chooses the response format.
 *
 * An explicit `?format=` always wins, since browsers and `curl` make the
 * Accept header awkward to control. Otherwise the Accept header is honoured by
 * descending q-value, and JSON is the default when nothing matches.
 */
export function negotiateFormat(request: Request, url: URL): Format {
  const requested = url.searchParams.get("format");
  if (requested) {
    const mapped = FORMAT_ALIASES[requested.trim().toLowerCase()];
    if (mapped) return mapped;
  }

  const accept = request.headers.get("accept");
  if (!accept) return "json";

  for (const entry of parseAccept(accept)) {
    const mapped = FORMAT_ALIASES[entry.type];
    if (mapped) return mapped;
    if (entry.type === "*/*") return "json";
    if (entry.type === "text/*") return "text";
    if (entry.type === "application/*") return "json";
  }
  return "json";
}
