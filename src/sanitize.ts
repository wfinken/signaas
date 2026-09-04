/** Longest accepted value for a name, title, company or recipient. */
export const MAX_FIELD_LENGTH = 64;

/**
 * Code points that never belong in a signature field.
 *
 * C0/C1 control characters would break the plain-text and header output;
 * zero-width, word-joiner and bidi-override characters are invisible once
 * rendered, which makes them a convenient spoofing tool. Both are dropped
 * before any template substitution happens.
 */
function isDisallowed(codePoint: number): boolean {
  if (codePoint < 0x20 || (codePoint >= 0x7f && codePoint <= 0x9f)) return true; // controls
  if (codePoint >= 0x200b && codePoint <= 0x200f) return true; // zero width + LRM/RLM
  if (codePoint >= 0x202a && codePoint <= 0x202e) return true; // bidi embedding/override
  if (codePoint >= 0x2060 && codePoint <= 0x2064) return true; // word joiner + invisible ops
  if (codePoint >= 0x2066 && codePoint <= 0x2069) return true; // bidi isolates
  return codePoint === 0xfeff; // BOM / zero width no-break space
}

/**
 * Cleans a user supplied field before it is injected into a template.
 *
 * The renderer escapes per output format as well; this pass exists so that no
 * format ever sees control characters, invisible spoofing characters, or an
 * unbounded string.
 */
export function sanitizeField(raw: string | null | undefined): string {
  if (!raw) return "";

  let value = "";
  for (const char of raw.normalize("NFC")) {
    const codePoint = char.codePointAt(0) ?? 0;
    if (isDisallowed(codePoint)) {
      // Controls become spaces so "Ada\nLovelace" stays two words.
      if (codePoint < 0x20 || (codePoint >= 0x7f && codePoint <= 0x9f)) value += " ";
      continue;
    }
    value += char;
  }

  value = value.replace(/\s+/g, " ").trim();
  if (value.length > MAX_FIELD_LENGTH) {
    value = value.slice(0, MAX_FIELD_LENGTH).trim() + "…";
  }
  return value;
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}
