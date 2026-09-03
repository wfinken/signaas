import { describe, expect, it } from "vitest";
import { CATEGORIES, findCategory, normalizeSlug } from "../src/categories";
import { listCategoryFiles, parseCategory, readCorpus } from "../scripts/build-corpus.mjs";

const PIRATE = `Pirate
description: Swashbuckling sign-offs for the seven seas.
aliases: pirates, arr, buccaneer
signer: Cap'n {name}

# The good ones go at the top.
Fair winds and following seas,
Reply swift, or walk the plank.
Sent from the crow's nest, | Lookout {name}
`;

describe("the corpus format", () => {
  it("reads a file into a category", () => {
    const category = parseCategory(PIRATE, "pirate.txt");
    expect(category.slug).toBe("pirate");
    expect(category.name).toBe("Pirate");
    expect(category.description).toBe("Swashbuckling sign-offs for the seven seas.");
    expect(category.aliases).toEqual(["pirates", "arr", "buccaneer"]);
    expect(category.templates).toEqual([
      { message: "Fair winds and following seas,", signer: "Cap'n {name}" },
      { message: "Reply swift, or walk the plank.", signer: "Cap'n {name}" },
      { message: "Sent from the crow's nest,", signer: "Lookout {name}" },
    ]);
  });

  it("takes the plainest file it can be given", () => {
    const category = parseCategory("Normal\ndescription: Polite.\n\nBest regards,\n", "normal.txt");
    expect(category.aliases).toEqual([]);
    expect(category.templates).toEqual([{ message: "Best regards," }]);
  });

  it("treats a signer of {name} as the default", () => {
    const category = parseCategory("Zen\ndescription: Calm.\n\nSit with it, | {name}\n", "zen.txt");
    expect(category.templates).toEqual([{ message: "Sit with it," }]);
  });

  // Every message below is what a contributor sees when they get it wrong, so
  // each one has to name the file, the line, and the way out.
  const mistakes: [string, string, RegExp][] = [
    [
      "a missing description",
      "Sea Shanty\n\nSoon may the reply-guy come,\n",
      /sea-shanty\.txt has no description\. Add a line like `description:/,
    ],
    [
      "no sign-offs at all",
      "Sea Shanty\ndescription: A work song.\n",
      /sea-shanty\.txt has no templates\. Leave a blank line/,
    ],
    [
      "an empty file",
      "\n\n",
      /sea-shanty\.txt is empty\. The first line is the tone's name\./,
    ],
    [
      "a misspelled setting",
      "Sea Shanty\ndescriptoin: A work song.\n\nHaul away,\n",
      /sea-shanty\.txt:2 sets "descriptoin", which is not a setting\. Use description, aliases, signer\./,
    ],
    [
      "a setting with no value",
      "Sea Shanty\ndescription:\n\nHaul away,\n",
      /sea-shanty\.txt:2 sets "description" to nothing\./,
    ],
    [
      "the name left off",
      "description: A work song.\n\nHaul away,\n",
      /sea-shanty\.txt:1 starts with a setting\. Put the tone's display name on the first line/,
    ],
    [
      "two signer separators",
      "Sea Shanty\ndescription: A work song.\n\nHaul away, | Sailor {name} | extra\n",
      /sea-shanty\.txt:4 has more than one `\|`/,
    ],
    [
      "a separator with nothing before it",
      "Sea Shanty\ndescription: A work song.\n\n| Sailor {name}\n",
      /sea-shanty\.txt:4 has a `\|` but no sign-off before it\./,
    ],
    [
      "a placeholder that does not exist",
      "Sea Shanty\ndescription: A work song.\n\nHaul away, {sailor},\n",
      /sea-shanty\.txt:4 uses \{sailor\}, which is not a placeholder\. Use \{name\}, \{title\}, \{company\}, \{recipient\}\./,
    ],
    [
      "the same sign-off twice",
      "Sea Shanty\ndescription: A work song.\n\nHaul away,\nHaul away,\n",
      /sea-shanty\.txt repeats "Haul away,"/,
    ],
  ];

  it.each(mistakes)("explains %s", (_name, text, expected) => {
    expect(() => parseCategory(text, "sea-shanty.txt")).toThrow(expected);
  });

  it("rejects a file name that could not be a URL", () => {
    expect(() => parseCategory("Sea Shanty\ndescription: A work song.\n\nHaul away,\n", "Sea Shanty.txt")).toThrow(
      /is not a usable name\. Use lowercase letters, digits and dashes/,
    );
  });
});

describe("the corpus", () => {
  it("bundles exactly the files in categories/", () => {
    expect(CATEGORIES.map((category) => category.slug + ".txt")).toEqual(listCategoryFiles());
  });

  it("matches what the build script reads off disk", () => {
    expect(readCorpus()).toEqual(CATEGORIES);
  });

  it("gives every tone a description and something to say", () => {
    for (const category of CATEGORIES) {
      expect(category.description, category.slug).not.toBe("");
      expect(category.templates.length, category.slug).toBeGreaterThan(0);
    }
  });

  it("gives every tone a lookup key nothing else claims", () => {
    const keys = CATEGORIES.flatMap((category) => [category.slug, ...category.aliases]).map((key) =>
      normalizeSlug(key),
    );
    expect(new Set(keys).size).toBe(keys.length);
    for (const category of CATEGORIES) {
      expect(findCategory(category.slug)).toBe(category);
      for (const alias of category.aliases) expect(findCategory(alias)).toBe(category);
    }
  });

  it("never repeats a sign-off, in any tone", () => {
    const messages = CATEGORIES.flatMap((category) =>
      category.templates.map((template) => template.message),
    );
    expect(new Set(messages).size).toBe(messages.length);
  });

  it("writes every haiku as three slash-separated lines", () => {
    const haiku = findCategory("haiku");
    expect(haiku).toBeDefined();
    for (const template of haiku!.templates) {
      expect(template.message.split(" / "), template.message).toHaveLength(3);
    }
  });
});
