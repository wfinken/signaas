#!/usr/bin/env node
/**
 * Builds the signature corpus from `categories/*.txt`.
 *
 * Cloudflare Workers have no filesystem, so the text files cannot be read at
 * runtime. This script bundles them into a generated TypeScript module instead.
 * It runs automatically before dev, test, typecheck, deploy and install, so
 * adding a tone means adding one text file and nothing else.
 *
 * Run it directly with `npm run corpus`.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = join(ROOT, "categories");
const OUTPUT = join(ROOT, "src", "corpus.generated.ts");

const SETTINGS = ["description", "aliases", "signer"];
const PLACEHOLDERS = ["name", "title", "company", "recipient"];
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** A contributor-facing failure: says which file and line, and what to do. */
export class CorpusError extends Error {
  constructor(where, message) {
    super(`${where} ${message}`);
    this.name = "CorpusError";
  }
}

const at = (file, line) => `categories/${file}:${line}`;

/**
 * Parses one category file.
 *
 * The first line is the display name. Any `key: value` lines after it are
 * settings. A blank line ends the header, and every line below it is one
 * template, optionally ending with `| how the name is signed`.
 */
export function parseCategory(text, file) {
  const slug = file.replace(/\.txt$/, "");
  if (!SLUG_PATTERN.test(slug)) {
    throw new CorpusError(
      `categories/${file}`,
      "is not a usable name. Use lowercase letters, digits and dashes, like `sea-shanty.txt`.",
    );
  }

  // Numbered so every message can point at the line the author wrote.
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).map((content, index) => ({
    content: content.trim(),
    number: index + 1,
  }));

  const start = lines.find((line) => line.content !== "");
  if (!start) throw new CorpusError(`categories/${file}`, "is empty. The first line is the tone's name.");
  if (start.content.includes(":") && SETTINGS.some((key) => start.content.startsWith(key + ":"))) {
    throw new CorpusError(
      at(file, start.number),
      `starts with a setting. Put the tone's display name on the first line, then "${start.content}".`,
    );
  }

  const category = { slug, name: start.content, description: "", aliases: [], templates: [] };
  let signer;
  let inHeader = true;

  for (const line of lines.slice(lines.indexOf(start) + 1)) {
    if (line.content === "") {
      inHeader = false;
      continue;
    }
    if (line.content.startsWith("#")) continue;

    const setting = inHeader ? /^([a-z]+):\s*(.*)$/.exec(line.content) : null;
    if (setting) {
      const [, key, value] = setting;
      if (!SETTINGS.includes(key)) {
        throw new CorpusError(
          at(file, line.number),
          `sets "${key}", which is not a setting. Use ${SETTINGS.join(", ")}.`,
        );
      }
      if (value === "") {
        throw new CorpusError(at(file, line.number), `sets "${key}" to nothing. Give it a value or drop the line.`);
      }
      if (key === "description") category.description = value;
      if (key === "signer") signer = value;
      if (key === "aliases") {
        category.aliases = value.split(",").map((alias) => alias.trim().toLowerCase()).filter(Boolean);
      }
      continue;
    }

    inHeader = false;
    const parts = line.content.split("|").map((part) => part.trim());
    if (parts.length > 2) {
      throw new CorpusError(
        at(file, line.number),
        "has more than one `|`. A template is `the sign-off | how the name is signed`.",
      );
    }
    const [message, ownSigner] = parts;
    if (!message) {
      throw new CorpusError(at(file, line.number), "has a `|` but no sign-off before it.");
    }
    for (const field of [message, ownSigner ?? signer ?? ""]) {
      for (const [, placeholder] of field.matchAll(/\{([^}]*)\}/g)) {
        if (!PLACEHOLDERS.includes(placeholder)) {
          throw new CorpusError(
            at(file, line.number),
            `uses {${placeholder}}, which is not a placeholder. Use ${PLACEHOLDERS.map((p) => `{${p}}`).join(", ")}.`,
          );
        }
      }
    }
    const chosen = ownSigner ?? signer;
    category.templates.push(chosen && chosen !== "{name}" ? { message, signer: chosen } : { message });
  }

  if (!category.description) {
    throw new CorpusError(
      `categories/${file}`,
      "has no description. Add a line like `description: What this tone sounds like.` under the name.",
    );
  }
  if (category.templates.length === 0) {
    throw new CorpusError(
      `categories/${file}`,
      "has no templates. Leave a blank line under the description, then write one sign-off per line.",
    );
  }

  const seen = new Map();
  for (const template of category.templates) {
    if (seen.has(template.message)) {
      throw new CorpusError(`categories/${file}`, `repeats "${template.message}". Every sign-off appears once.`);
    }
    seen.set(template.message, true);
  }
  return category;
}

/** The category files, in the order they will appear on the site. */
export function listCategoryFiles(directory = SOURCE_DIR) {
  return readdirSync(directory).filter((file) => file.endsWith(".txt")).sort();
}

/** Reads every category file, and checks they agree with each other. */
export function readCorpus(directory = SOURCE_DIR) {
  const files = listCategoryFiles(directory);
  if (files.length === 0) throw new CorpusError("categories/", "has no .txt files in it.");

  const categories = files.map((file) => parseCategory(readFileSync(join(directory, file), "utf8"), file));

  const keys = new Map();
  const messages = new Map();
  for (const category of categories) {
    for (const key of [category.slug, ...category.aliases]) {
      const normalized = key.replace(/[\s_]+/g, "-");
      const owner = keys.get(normalized);
      if (owner && owner !== category.slug) {
        throw new CorpusError(
          `categories/${category.slug}.txt`,
          `claims "${key}", which categories/${owner}.txt already answers to. Pick another alias.`,
        );
      }
      keys.set(normalized, category.slug);
    }
    for (const template of category.templates) {
      const owner = messages.get(template.message);
      if (owner) {
        throw new CorpusError(
          `categories/${category.slug}.txt`,
          `repeats "${template.message}", which is already in categories/${owner}.txt.`,
        );
      }
      messages.set(template.message, category.slug);
    }
  }
  return categories;
}

export function render(categories) {
  const entry = (template) =>
    template.signer
      ? `      { message: ${JSON.stringify(template.message)}, signer: ${JSON.stringify(template.signer)} },`
      : `      { message: ${JSON.stringify(template.message)} },`;

  const body = categories.map((category) => [
    "  {",
    `    slug: ${JSON.stringify(category.slug)},`,
    `    name: ${JSON.stringify(category.name)},`,
    `    description: ${JSON.stringify(category.description)},`,
    `    aliases: ${JSON.stringify(category.aliases)},`,
    "    templates: [",
    ...category.templates.map(entry),
    "    ],",
    "  },",
  ].join("\n"));

  return [
    "// Generated from categories/*.txt by scripts/build-corpus.mjs.",
    "// Do not edit this file: edit the text files and run `npm run corpus`.",
    'import type { Category } from "./categories";',
    "",
    "export const CATEGORIES: Category[] = [",
    ...body,
    "];",
    "",
  ].join("\n");
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  try {
    const categories = readCorpus();
    writeFileSync(OUTPUT, render(categories));
    const templates = categories.reduce((total, category) => total + category.templates.length, 0);
    console.log(`corpus: ${categories.length} tones, ${templates} templates`);
  } catch (error) {
    if (error instanceof CorpusError) {
      console.error(`\n  ${error.message}\n\n  See categories/README.md for the format.\n`);
      process.exit(1);
    }
    throw error;
  }
}
