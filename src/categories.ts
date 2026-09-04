/**
 * The signature corpus lives in `categories/*.txt`, one file per tone, so that
 * adding a tone or a sign-off is a text edit rather than a code change. See
 * categories/README.md for the format, and scripts/build-corpus.mjs for the
 * build step that bundles those files into `corpus.generated.ts`.
 */
import { CATEGORIES } from "./corpus.generated";

export interface Template {
  /** The sign-off line, e.g. "Best regards,". */
  message: string;
  /** How the name is presented, e.g. "Cap'n {name}". Defaults to "{name}". */
  signer?: string;
}

export interface Category {
  /** URL slug, e.g. "passive-aggressive". Taken from the file name. */
  slug: string;
  /** Human readable name for docs and the homepage. */
  name: string;
  /** One line description. */
  description: string;
  /** Alternate slugs that resolve to this category. */
  aliases: string[];
  templates: Template[];
}

export { CATEGORIES };

export const TOTAL_TEMPLATES = CATEGORIES.reduce(
  (total, category) => total + category.templates.length,
  0,
);

const INDEX = new Map<string, Category>();
for (const category of CATEGORIES) {
  INDEX.set(category.slug, category);
  for (const alias of category.aliases) INDEX.set(alias, category);
}

/** Normalizes a user supplied slug: lowercase, underscores/spaces to dashes. */
export function normalizeSlug(input: string): string {
  return input.trim().toLowerCase().replace(/[\s_]+/g, "-");
}

export function findCategory(slug: string): Category | undefined {
  return INDEX.get(normalizeSlug(slug));
}
