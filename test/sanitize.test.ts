import { describe, expect, it } from "vitest";
import { MAX_FIELD_LENGTH, escapeHtml, sanitizeField } from "../src/sanitize";
import { get } from "./helpers";

const NEWLINE = String.fromCharCode(0x0a);
const DEL = String.fromCharCode(0x7f);
const ZERO_WIDTH_SPACE = String.fromCharCode(0x200b);
const RTL_OVERRIDE = String.fromCharCode(0x202e);

describe("sanitizeField", () => {
  it("collapses whitespace and trims", () => {
    expect(sanitizeField("  Ada   Lovelace \t")).toBe("Ada Lovelace");
  });

  it("turns control characters into spaces", () => {
    expect(sanitizeField("Ada" + NEWLINE + "Lovelace")).toBe("Ada Lovelace");
    expect(sanitizeField("Ada" + DEL + "Lovelace")).toBe("Ada Lovelace");
  });

  it("drops invisible and bidi-override characters", () => {
    expect(sanitizeField("Ada" + ZERO_WIDTH_SPACE + "Love" + RTL_OVERRIDE + "lace")).toBe(
      "AdaLovelace",
    );
  });

  it("truncates long values", () => {
    expect(sanitizeField("a".repeat(200))).toHaveLength(MAX_FIELD_LENGTH + 1);
  });

  it("keeps ordinary unicode names intact", () => {
    expect(sanitizeField("Zoë Ngô")).toBe("Zoë Ngô");
    expect(sanitizeField("大輔")).toBe("大輔");
  });

  it("returns an empty string for missing input", () => {
    expect(sanitizeField(null)).toBe("");
    expect(sanitizeField(undefined)).toBe("");
    expect(sanitizeField("   ")).toBe("");
  });
});

describe("escapeHtml", () => {
  it("escapes every HTML metacharacter", () => {
    expect(escapeHtml("<b>\"x\"&'y'")).toBe("&lt;b&gt;&quot;x&quot;&amp;&#39;y&#39;");
  });
});

describe("injection", () => {
  it("escapes markup in HTML output", async () => {
    const response = await get("/normal/%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E", {
      headers: { accept: "text/html" },
    });
    const body = await response.text();
    expect(body).not.toContain("<img");
    expect(body).toContain("&lt;img");
  });

  it("keeps injected markup intact but inert in JSON values", async () => {
    const response = await get("/normal/%3C%2Fscript%3E");
    const body = (await response.json()) as { subtitle: string };
    expect(body.subtitle).toBe("— </script>");
  });

  it("cannot smuggle extra lines into plain text output", async () => {
    const response = await get("/normal/Ada%0AEvil", { headers: { accept: "text/plain" } });
    const body = (await response.text()).trim();
    expect(body.split(NEWLINE)).toHaveLength(2);
    expect(body).toContain("Ada Evil");
  });

  it("truncates an oversized name before it reaches a template", async () => {
    const response = await get("/normal/" + "x".repeat(500));
    const body = (await response.json()) as { subtitle: string };
    expect(body.subtitle.length).toBeLessThan(MAX_FIELD_LENGTH + 10);
  });
});
