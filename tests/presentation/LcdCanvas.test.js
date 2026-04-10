import { describe, expect, it } from "vitest";
import { getGlyphBitmap, getGlyphVerticalMetrics, measureBitmapTextWidth, normalizeFontChar } from "../../src/presentation/components/LcdCanvas.jsx";

function rowsToStrings(glyph) {
  return glyph.map((row) => row.map((value) => (value ? "#" : ".")).join(""));
}

describe("LcdCanvas bitmap font", () => {
  it("keeps lowercase latin characters lowercase when glyphs exist", () => {
    expect(normalizeFontChar("a")).toBe("a");
    expect(normalizeFontChar("z")).toBe("z");
  });

  it("keeps lowercase cyrillic characters lowercase when glyphs exist", () => {
    expect(normalizeFontChar("\u044f")).toBe("\u044f");
    expect(normalizeFontChar("\u0439")).toBe("\u0439");
  });

  it("uses a distinct glyph for uppercase Й with the top mark", () => {
    const glyph = getGlyphBitmap("\u0419");
    expect(glyph[0].some(Boolean)).toBe(true);
    expect(glyph[1].some(Boolean)).toBe(true);
  });

  it("keeps latin a distinct from cyrillic а and applies corrected overrides", () => {
    expect(rowsToStrings(getGlyphBitmap("a"))).toEqual([
      ".....",
      ".....",
      ".###.",
      "....#",
      ".####",
      "#...#",
      "#..##",
      ".##.#",
    ]);
    expect(rowsToStrings(getGlyphBitmap("\u0430"))).toEqual([
      ".....",
      ".....",
      ".##..",
      "#..#.",
      "####.",
      "#..#.",
      "#..#.",
      ".....",
    ]);
    expect(rowsToStrings(getGlyphBitmap("a"))).not.toEqual(rowsToStrings(getGlyphBitmap("\u0430")));

    expect(rowsToStrings(getGlyphBitmap("\u0431"))).toEqual([
      ".###.",
      "#....",
      "####.",
      "#...#",
      "####.",
      "#...#",
      "#...#",
      ".###.",
    ]);
    expect(rowsToStrings(getGlyphBitmap("\u0439"))).toEqual([
      "..#..",
      ".#.#.",
      ".....",
      "#...#",
      "#...#",
      "#.#.#",
      "##..#",
      "#...#",
    ]);
    expect(rowsToStrings(getGlyphBitmap("\u043b"))).toEqual([
      ".....",
      ".....",
      ".###.",
      ".#..#",
      "#...#",
      "#...#",
      "#...#",
      ".....",
    ]);
    expect(rowsToStrings(getGlyphBitmap("\u044e"))).toEqual([
      "......",
      "......",
      "#..##.",
      "#.#..#",
      "#####.",
      "#.#..#",
      "#.#..#",
      "#..##.",
    ]);
  });

  it("keeps expected baseline alignment for lowercase body glyphs", () => {
    expect(getGlyphVerticalMetrics("a").top).toBe(2);
    expect(getGlyphVerticalMetrics("\u0430").top).toBe(2);
    expect(getGlyphVerticalMetrics("\u043b").top).toBe(2);
  });

  it("measures visible width with proportional glyphs", () => {
    expect(measureBitmapTextWidth("III")).toBeLessThan(measureBitmapTextWidth("WWW"));
    expect(measureBitmapTextWidth("Нижняя грани")).toBeGreaterThan(0);
  });
});
