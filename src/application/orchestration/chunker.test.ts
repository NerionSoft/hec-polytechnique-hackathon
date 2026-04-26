import { describe, expect, it } from "vitest";
import { chunkText } from "./chunker";

describe("chunkText", () => {
  it("emits empty array on empty input", () => {
    expect(chunkText("")).toEqual([]);
  });

  it("tags chunks with the most recent §n.m header", () => {
    const text = `
1. EXECUTIVE SUMMARY

This is the executive summary content with enough chars to exceed the minimum threshold easily.

2. SCOPE AND PURPOSE

The scope describes how the analysis was performed for this fiscal year, including key sources.
`;
    const chunks = chunkText(text, { maxChars: 4000, minChars: 30 });
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[0].sectionRef).toBe("§1");
    expect(chunks[1].sectionRef).toBe("§2");
  });

  it("preserves the section across paragraphs until the next header", () => {
    const text = `
3. KEY FINANCIAL METRICS

Revenue FY2024: €31,000,000.

EBITDA FY2024: €4,200,000.

4. RISK FACTORS

Customer concentration top-3 = 64%.
`;
    const chunks = chunkText(text, { maxChars: 4000, minChars: 10 });
    const sec3 = chunks.filter((c) => c.sectionRef === "§3");
    expect(sec3.length).toBeGreaterThanOrEqual(1);
    expect(chunks.some((c) => c.sectionRef === "§4")).toBe(true);
  });

  it("hard-splits a single oversized paragraph", () => {
    const longText = "word ".repeat(2000); // ~10k chars
    const chunks = chunkText(longText, { maxChars: 1000, minChars: 30 });
    expect(chunks.length).toBeGreaterThan(5);
    for (const c of chunks) {
      expect(c.text.length).toBeLessThanOrEqual(1000);
    }
  });

  it("tracks page numbers via form-feed markers", () => {
    const text =
      "Page one paragraph long enough to exceed the min threshold easily.\f" +
      "Page two paragraph also long enough to exceed the min threshold easily.";
    const chunks = chunkText(text, { maxChars: 4000, minChars: 30 });
    expect(chunks).toHaveLength(2);
    expect(chunks[0].page).toBe(1);
    expect(chunks[1].page).toBe(2);
  });

  it("drops chunks below minChars", () => {
    const text = "tiny";
    const chunks = chunkText(text, { maxChars: 100, minChars: 60 });
    expect(chunks).toEqual([]);
  });
});
