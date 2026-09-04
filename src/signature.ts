import type { Category, Template } from "./categories";
import { escapeHtml, sanitizeField } from "./sanitize";

export interface SignatureFields {
  name: string;
  title?: string;
  company?: string;
  recipient?: string;
}

export interface Signature {
  category: string;
  /** The sign-off body, e.g. "Per my last email,". */
  message: string;
  /** The name as the template writes it, e.g. "Cap'n Blackbeard". */
  signer: string;
  /** The attribution line, e.g. "- Alice, VP of Sales" (with an em dash). */
  subtitle: string;
  fields: Required<SignatureFields>;
}

const EM_DASH = "—";

/**
 * Deterministic 32 bit string hash (FNV-1a). Backs `?seed=`, so a caller can
 * pin a template choice for tests, snapshots or cached signatures.
 */
function hash(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function pickTemplate(category: Category, seed?: string): Template {
  const templates = category.templates;
  const index =
    seed === undefined || seed === ""
      ? Math.floor(Math.random() * templates.length)
      : hash(category.slug + ":" + seed) % templates.length;
  // `templates` is never empty; the fallback only satisfies the type checker.
  return templates[index] ?? templates[0]!;
}

/** Substitutes {name}, {title}, {company} and {recipient}; tidies the gaps left behind. */
function fill(template: string, fields: Required<SignatureFields>): string {
  return template
    .replace(/\{(name|title|company|recipient)\}/g, (_m, key: keyof SignatureFields) => fields[key])
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

export function buildSignature(
  category: Category,
  rawFields: SignatureFields,
  seed?: string,
): Signature {
  const template = pickTemplate(category, seed);
  const fields: Required<SignatureFields> = {
    name: sanitizeField(rawFields.name),
    title: sanitizeField(rawFields.title),
    company: sanitizeField(rawFields.company),
    recipient: sanitizeField(rawFields.recipient),
  };

  const message = fill(template.message, fields);
  const signer = fill(template.signer ?? "{name}", fields);
  const attribution = [signer, fields.title, fields.company].filter(Boolean).join(", ");

  return {
    category: category.slug,
    message,
    signer,
    subtitle: attribution ? EM_DASH + " " + attribution : "",
    fields,
  };
}

/** The JSON body promised by the API: the sign-off plus its attribution. */
export function toJson(signature: Signature): { message: string; subtitle: string } {
  return { message: signature.message, subtitle: signature.subtitle };
}

export function toText(signature: Signature): string {
  return signature.subtitle ? signature.message + "\n" + signature.subtitle : signature.message;
}

export function toHtml(signature: Signature): string {
  const { message, signer, fields } = signature;
  const lines: string[] = [];
  if (signer) lines.push("<strong>" + escapeHtml(signer) + "</strong>");
  if (fields.title) lines.push("<em>" + escapeHtml(fields.title) + "</em>");
  if (fields.company) lines.push(escapeHtml(fields.company));
  const paragraphs = ["<p>" + escapeHtml(message) + "</p>"];
  if (lines.length) paragraphs.push("<p>" + lines.join("<br/>") + "</p>");
  return paragraphs.join("\n");
}
