import { describe, expect, it } from "vitest";
import {
  getBitmapGlyphMatrix,
  getLcdRows,
  LCDRenderer,
  serializeBitmapFontCDefinition,
  serializeScreenBufferCDefinition,
} from "../../src/infrastructure/adapters/LcdRenderer.js";
import { createDiagnosticSteps, initialDevice } from "../../src/domain/usecases/index.js";
import { PANEL_LABEL_DEFAULTS } from "../../src/presentation/components/InstrumentPanel.jsx";

function createPixelRecordingContext() {
  const pixels = [];

  return {
    pixels,
    clearRect() {},
    fillRect(x, y, width, height) {
      if (width === 1 && height === 1) pixels.push(`${x},${y}`);
    },
    strokeRect() {},
  };
}

function getRenderedGlyphBounds(text) {
  const ctx = createPixelRecordingContext();
  LCDRenderer.renderTextPreview(ctx, text, { width: 128, height: 12 });
  const columns = [...new Set(ctx.pixels.map((pixel) => Number(pixel.split(",")[0])))].sort((a, b) => a - b);
  const groups = [];

  columns.forEach((column) => {
    const last = groups[groups.length - 1];
    if (!last || column > last.max + 1) {
      groups.push({ min: column, max: column });
      return;
    }

    last.max = column;
  });

  return groups;
}

function renderPreviewPixels(text) {
  const ctx = createPixelRecordingContext();
  LCDRenderer.renderTextPreview(ctx, text, { width: 32, height: 12 });
  return ctx.pixels.sort();
}

function getRenderedGlyphBox(text) {
  const points = renderPreviewPixels(text).map((pixel) => {
    const [x, y] = pixel.split(",").map(Number);
    return { x, y };
  });

  return {
    minX: Math.min(...points.map((point) => point.x)),
    maxX: Math.max(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
}

describe("LCDRenderer glyph lookup", () => {
  it("accepts mixed-case Cyrillic words from the project glyph specification", () => {
    expect(LCDRenderer.getUnmappedGlyphs("Диагностика")).toEqual([]);
  });

  it("accepts mixed-case Latin words from the project glyph specification", () => {
    expect(LCDRenderer.getUnmappedGlyphs("diagnostic")).toEqual([]);
  });

  it("accepts mixed-script warmup labels", () => {
    expect(LCDRenderer.getUnmappedGlyphs("Прогрев")).toEqual([]);
    expect(LCDRenderer.getUnmappedGlyphs("ESC - Пропуск")).toEqual([]);
  });

  it("warns for glyphs missing from the bitmap font", () => {
    expect(LCDRenderer.getUnmappedGlyphs("~")).toEqual([{ char: "~", codepoint: "U+007E" }]);
  });

  it("covers the full Russian and English alphabets in both cases", () => {
    expect(LCDRenderer.getUnmappedGlyphs("АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ")).toEqual([]);
    expect(LCDRenderer.getUnmappedGlyphs("абвгдеёжзийклмнопрстуфхцчшщъыьэюя")).toEqual([]);
    expect(LCDRenderer.getUnmappedGlyphs("ABCDEFGHIJKLMNOPQRSTUVWXYZ")).toEqual([]);
    expect(LCDRenderer.getUnmappedGlyphs("abcdefghijklmnopqrstuvwxyz")).toEqual([]);
  });

  it("covers common precomposed and combining diacritics for Latin and Cyrillic glyphs", () => {
    expect(LCDRenderer.getUnmappedGlyphs("ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝŸ")).toEqual([]);
    expect(LCDRenderer.getUnmappedGlyphs("àáâãäåçèéêëìíîïñòóôõöùúûüýÿ")).toEqual([]);
    expect(LCDRenderer.getUnmappedGlyphs("ČčĞğŠšŽžĄąĘęİıЁЙёй")).toEqual([]);
    expect(LCDRenderer.getUnmappedGlyphs("A\u0308C\u0327N\u0303e\u0301и\u0306е\u0308")).toEqual([]);
  });

  it("uses the same glyph placement in bitmap preview and LCD bitmap rows", () => {
    const previewCtx = createPixelRecordingContext();
    const lcdCtx = createPixelRecordingContext();

    LCDRenderer.renderTextPreview(previewCtx, "ESC - РџСЂРѕРїСѓСЃРє", { width: 128, height: 12 });
    LCDRenderer.render(lcdCtx, [{ text: "ESC - РџСЂРѕРїСѓСЃРє", x: 2, y: 2 }]);

    expect(lcdCtx.pixels.sort()).toEqual(previewCtx.pixels.sort());
  });

  it("keeps the gap around narrow monospace glyphs uniform", () => {
    expect(getRenderedGlyphBounds("AIA")).toEqual([
      { min: 2, max: 6 },
      { min: 9, max: 11 },
      { min: 14, max: 18 },
    ]);
  });

  it("renders diacritic glyphs differently from their base glyphs", () => {
    expect(renderPreviewPixels("Ё")).not.toEqual(renderPreviewPixels("Е"));
    expect(renderPreviewPixels("Й")).not.toEqual(renderPreviewPixels("И"));
    expect(renderPreviewPixels("ё")).not.toEqual(renderPreviewPixels("е"));
    expect(renderPreviewPixels("й")).not.toEqual(renderPreviewPixels("и"));
    expect(renderPreviewPixels("Ä")).not.toEqual(renderPreviewPixels("A"));
    expect(renderPreviewPixels("Ç")).not.toEqual(renderPreviewPixels("C"));
  });

  it("keeps Д and д on the full baseline, keeps к lowercase, and lifts λ to uppercase height", () => {
    expect(getRenderedGlyphBox("Д")).toMatchObject({ minY: 2, maxY: 9 });
    expect(getRenderedGlyphBox("д")).toMatchObject({ maxY: 9 });
    expect(getRenderedGlyphBox("к")).toMatchObject({ minY: 4, maxY: 9 });
    expect(getRenderedGlyphBox("λ")).toMatchObject({ minY: 2, maxY: 9 });
  });

  it("applies glyph overrides on top of the default bitmap font", () => {
    const override = Array.from({ length: 8 }, () => [1, 1, 1, 1, 1]);

    expect(getBitmapGlyphMatrix("A")).not.toEqual(override);
    expect(getBitmapGlyphMatrix("A", { glyphOverrides: { A: override } })).toEqual(override);
  });

  it("renders lowercase к from the bitmap specification without an extra bottom row", () => {
    expect(getBitmapGlyphMatrix("к")).toEqual([
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 0, 0, 1],
      [1, 0, 0, 1],
      [1, 0, 1, 0],
      [1, 1, 0, 0],
      [1, 0, 1, 0],
      [1, 0, 0, 1],
    ]);
  });

  it("keeps regular lowercase Cyrillic and Latin glyphs on a unified baseline", () => {
    const samples = "абвгежзиклмнопрстуфхцчшщъыьэюяabcdefghijklmnopqrstuvwxyz";
    const boxes = Array.from(samples).map((char) => ({ char, box: getRenderedGlyphBox(char) }));
    const reference = boxes[0].box;

    boxes.forEach(({ char, box }) => {
      expect(box, `glyph ${char}`).toMatchObject({ minY: reference.minY, maxY: reference.maxY });
    });
  });

  it("serializes the current LCD screen and font into C-like arrays", () => {
    const screenExport = serializeScreenBufferCDefinition([{ text: "TEST", x: 2, y: 2 }], {
      variableName: "kUnitScreen",
    });
    const fontExport = serializeBitmapFontCDefinition({ Ж: Array.from({ length: 8 }, () => [1, 0, 1, 0, 1]) });

    expect(screenExport).toContain("static const uint8_t kUnitScreen");
    expect(fontExport).toContain("static const lcd_glyph_t kLcdGlyphs[]");
    expect(fontExport).toContain("__status_success");
  });
});

describe("getLcdRows", () => {
  it("uses title-case warmup labels", () => {
    const rows = getLcdRows({
      screen: "warmup",
      warmupRemaining: 75,
      emulatorPaused: false,
    });

    expect(rows[0]?.text.trimEnd()).toBe("Прогрев");
    expect(rows[1]?.text.trimEnd()).toBe("ESC - Пропуск");
  });

  it("renders diagnostic rows with explicit status indicators", () => {
    const device = initialDevice();
    device.screen = "diagnostic";
    device.diagnosticSteps = createDiagnosticSteps().map((step, index) => ({
      ...step,
      status: index === 0 ? "success" : index === 1 ? "running" : index === 2 ? "error" : "pending",
    }));

    const rows = getLcdRows(device);

    expect(rows[1]).toMatchObject({ statusIndicator: "success" });
    expect(rows[2]).toMatchObject({ statusIndicator: "running" });
    expect(rows[3]).toMatchObject({ statusIndicator: "error" });
    expect(rows[4]).toMatchObject({ statusIndicator: "pending" });
  });
});

describe("panel keyboard defaults", () => {
  it("uses latin keypad sublabels", () => {
    expect(PANEL_LABEL_DEFAULTS.digit2Sub).toBe("ABC");
    expect(PANEL_LABEL_DEFAULTS.digit7Sub).toBe("PQRS");
    expect(PANEL_LABEL_DEFAULTS.digit9Sub).toBe("WXYZ");
  });
});
