import {
  FILE_ACTIONS,
  FILE_GROUPS,
  MENU_KINETICS,
  MENU_MAIN,
  MENU_MULTIWAVE,
  MENU_PHOTOMETRY_VALUE,
  MENU_QUANT,
  MENU_SETTINGS,
  UNITS,
} from "../../domain/constants/index.js";
import {
  formatMmSs,
  getCalibrationDoneCount,
  getCalibrationResultIndexes,
} from "../../domain/usecases/index.js";
import { center, pad } from "../../domain/usecases/utils.js";
import glyphSpecificationRaw from "../../../docs/glyph-specification-lcd-128x64-v2.2.md?raw";

const LCD_FG = "#0f172a";
const LCD_BG = "#edf2ed";
const LCD_MARGIN = 3;
const LCD_W = 128;
const LCD_H = 64;
const GLYPH_H = 8;
const SPACE_W = 5;
const MONO_ADVANCE_W = 6;
const TITLE_UNDERLINE_OFFSET = GLYPH_H + 1;
const GLYPH_CACHE = new Map();
const GLYPH_METRICS_CACHE = new Map();
const COMPOSED_GLYPH_CACHE = new Map();
const HEX_COLOR_RE = /^#([0-9a-f]{6})$/i;
const COMBINING_MARK_RE = /^\p{M}$/u;
const LETTER_BASE_RE = /^[\p{Script=Latin}\p{Script=Cyrillic}]$/u;

function rowsFromStrings(strings) {
  return strings.map((row) =>
    Array.from(String(row)).map((char) => {
      if (char === "#" || char === "1") return 1;
      return 0;
    }),
  );
}

const UNKNOWN_GLYPH = rowsFromStrings([
  "11111",
  "10001",
  "10101",
  "10001",
  "10101",
  "10001",
  "10001",
  "11111",
]);

const DOTLESS_I_GLYPH = rowsFromStrings(padGlyphRowsToHeight([
  ".#.",
  ".#.",
  ".#.",
  ".#.",
  "###",
], { alignBottom: true }));

const FORCED_COMPOSED_GLYPHS = new Set(["Ё", "Й", "ё", "й", "Д", "д", "к", "λ", "Λ"]);
const EXPLICIT_GLYPH_OVERRIDES = {
  Ё: rowsFromStrings([
    ".#.#.",
    "#####",
    "#....",
    "####.",
    "#....",
    "#....",
    "#....",
    "#####",
  ]),
  Й: rowsFromStrings([
    ".###.",
    "#...#",
    "#...#",
    "#...#",
    "#..##",
    "#.#.#",
    "##..#",
    "#...#",
  ]),
  Д: rowsFromStrings([
    "...###.",
    "..#..#.",
    ".#...#.",
    ".#...#.",
    ".#...#.",
    ".#...#.",
    "#######",
    "#.....#",
  ]),
  д: rowsFromStrings([
    "......",
    "......",
    "......",
    ".###..",
    ".#..#.",
    ".#..#.",
    "######",
    "#....#",
  ]),
  к: rowsFromStrings([
    "....",
    "....",
    "#..#",
    "#.#.",
    "##..",
    "#.#.",
    "#..#",
    "#..#",
  ]),
  λ: rowsFromStrings([
    "..#..",
    "..#..",
    ".#.#.",
    ".#.#.",
    "#...#",
    "#...#",
    "#...#",
    "#...#",
  ]),
  Λ: rowsFromStrings([
    "..#..",
    "..#..",
    ".#.#.",
    ".#.#.",
    "#...#",
    "#...#",
    "#...#",
    "#...#",
  ]),
};

function padGlyphRowsToHeight(rows, { alignBottom = false } = {}) {
  const width = Math.max(1, ...rows.map((row) => row.length));
  const normalizedRows = rows.map((row) => row.padEnd(width, "."));

  if (normalizedRows.length >= GLYPH_H) return normalizedRows.slice(0, GLYPH_H);

  const topPadding = alignBottom
    ? GLYPH_H - normalizedRows.length
    : normalizedRows.length <= GLYPH_H - 2 ? 1 : 0;
  const bottomPadding = GLYPH_H - normalizedRows.length - topPadding;
  const emptyRow = ".".repeat(width);

  return [
    ...Array.from({ length: topPadding }, () => emptyRow),
    ...normalizedRows,
    ...Array.from({ length: bottomPadding }, () => emptyRow),
  ];
}

function extractVariant2LowercaseGlyphs(markdown) {
  const variant2Section = markdown.match(/# ВАРИАНТ 2:[\s\S]*?(?=\r?\n# ВАРИАНТ 3:|$)/u)?.[0];
  if (!variant2Section) return {};

  const glyphs = {};
  const blockPattern = /^###\s+(\S).*?\r?\n```([\s\S]*?)```/gmu;

  for (const match of variant2Section.matchAll(blockPattern)) {
    const char = match[1];
    if (!/[\p{Ll}λ]/u.test(char)) continue;

    const rows = match[2]
      .split(/\r?\n/)
      .map((line) => line.trim())
      .map((line) => line.replace(/\s+/g, "").replace(/[^#.]/g, ""))
      .filter(Boolean);

    if (!rows.length) continue;
    glyphs[char] = rowsFromStrings(padGlyphRowsToHeight(rows, { alignBottom: true }));
  }

  return glyphs;
}

export const FONT_BITMAP = (() => {
  const map = {};
  const add = (chars, rows) => chars.forEach((char) => { map[char] = rowsFromStrings(rows); });

  add(["0"], [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", "#...#", ".###."]);
  add(["1"], ["..#.", ".##.", "#.#.", "..#.", "..#.", "..#.", "..#.", "####"]);
  add(["2"], [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#....", "#####"]);
  add(["3"], [".###.", "#...#", "....#", "..##.", "....#", "....#", "#...#", ".###."]);
  add(["4"], ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#.", "...#."]);
  add(["5"], ["#####", "#....", "#....", "####.", "....#", "....#", "#...#", ".###."]);
  add(["6"], ["..##.", ".#...", "#....", "####.", "#...#", "#...#", "#...#", ".###."]);
  add(["7"], ["#####", "....#", "...#.", "...#.", "..#..", "..#..", ".#...", ".#..."]);
  add(["8"], [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", "#...#", ".###."]);
  add(["9"], [".###.", "#...#", "#...#", "#...#", ".####", "....#", "...#.", ".##.."]);

  add(["А"], ["..#..", ".#.#.", ".#.#.", "#...#", "#...#", "#####", "#...#", "#...#"]);
  add(["Б"], ["#####", "#....", "#....", "####.", "#...#", "#...#", "#...#", "####."]);
  add(["В"], ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "#...#", "####."]);
  add(["Г"], ["#####", "#....", "#....", "#....", "#....", "#....", "#....", "#...."]);
  add(["Д"], ["..###..", "..#.#..", ".#...#.", ".#...#.", "#.....#", "#######", "#.....#", "#.....#"]);
  add(["Е"], ["#####", "#....", "#....", "####.", "#....", "#....", "#....", "#####"]);
  add(["Ж"], ["#..#..#", "#..#..#", ".#.#.#.", "..###..", "..###..", ".#.#.#.", "#..#..#", "#..#..#"]);
  add(["З"], [".###.", "#...#", "....#", "..##.", "....#", "....#", "#...#", ".###."]);
  add(["И"], ["#...#", "#...#", "#...#", "#..##", "#.#.#", "##..#", "#...#", "#...#"]);
  add(["К"], ["#...#", "#..#.", "#.#..", "##...", "##...", "#.#..", "#..#.", "#...#"]);
  add(["Л"], [".####", ".#..#", ".#..#", "#...#", "#...#", "#...#", "#...#", "#...#"]);
  add(["М"], ["#.....#", "##...##", "#.#.#.#", "#..#..#", "#.....#", "#.....#", "#.....#", "#.....#"]);
  add(["Н"], ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#", "#...#"]);
  add(["О"], [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."]);
  add(["П"], ["#####", "#...#", "#...#", "#...#", "#...#", "#...#", "#...#", "#...#"]);
  add(["Р"], ["####.", "#...#", "#...#", "####.", "#....", "#....", "#....", "#...."]);
  add(["С"], [".###.", "#...#", "#....", "#....", "#....", "#....", "#...#", ".###."]);
  add(["Т"], ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."]);
  add(["У"], ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", ".#...", "#...."]);
  add(["Ф"], ["...#...", "...#...", ".#####.", "#..#..#", "#..#..#", ".#####.", "...#...", "...#..."]);
  add(["Х"], ["#...#", "#...#", ".#.#.", "..#..", "..#..", ".#.#.", "#...#", "#...#"]);
  add(["Ц"], ["#....#", "#....#", "#....#", "#....#", "#....#", "#....#", "######", ".....#"]);
  add(["Ч"], ["#...#", "#...#", "#...#", ".####", "....#", "....#", "....#", "....#"]);
  add(["Ш"], ["#..#..#", "#..#..#", "#..#..#", "#..#..#", "#..#..#", "#..#..#", "#..#..#", "#######"]);
  add(["Щ"], ["#..#..#", "#..#..#", "#..#..#", "#..#..#", "#..#..#", "#..#..#", "#######", "......#"]);
  add(["Ъ"], ["##....", ".#....", ".#....", ".####.", ".#...#", ".#...#", ".#...#", ".####."]);
  add(["Ы"], ["#.....#", "#.....#", "#.....#", "####..#", "#...#.#", "#...#.#", "#...#.#", "####..#"]);
  add(["Ь"], ["#....", "#....", "#....", "####.", "#...#", "#...#", "#...#", "####."]);
  add(["Э"], [".###.", "#...#", "....#", "....#", "..###", "....#", "#...#", ".###."]);
  add(["Ю"], ["#...##.", "#..#..#", "#..#..#", "####..#", "#..#..#", "#..#..#", "#..#..#", "#...##."]);
  add(["Я"], [".####", "#...#", "#...#", ".####", "..#.#", ".#..#", "#...#", "#...#"]);

  add(["A"], ["..#..", ".#.#.", ".#.#.", "#...#", "#...#", "#####", "#...#", "#...#"]);
  add(["B"], ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "#...#", "####."]);
  add(["C"], [".###.", "#...#", "#....", "#....", "#....", "#....", "#...#", ".###."]);
  add(["D"], ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "#...#", "####."]);
  add(["E"], ["#####", "#....", "#....", "####.", "#....", "#....", "#....", "#####"]);
  add(["F"], ["#####", "#....", "#....", "####.", "#....", "#....", "#....", "#...."]);
  add(["G"], [".###.", "#...#", "#....", "#....", "#.###", "#...#", "#...#", ".###."]);
  add(["H"], ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#", "#...#"]);
  add(["I"], ["###", ".#.", ".#.", ".#.", ".#.", ".#.", ".#.", "###"]);
  add(["J"], ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", "#..#.", ".##.."]);
  add(["K"], ["#...#", "#..#.", "#.#..", "##...", "##...", "#.#..", "#..#.", "#...#"]);
  add(["L"], ["#....", "#....", "#....", "#....", "#....", "#....", "#....", "#####"]);
  add(["M"], ["#.....#", "##...##", "#.#.#.#", "#..#..#", "#.....#", "#.....#", "#.....#", "#.....#"]);
  add(["N"], ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#", "#...#"]);
  add(["O"], [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."]);
  add(["P"], ["####.", "#...#", "#...#", "####.", "#....", "#....", "#....", "#...."]);
  add(["Q"], [".###.", "#...#", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"]);
  add(["R"], ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#", "#...#"]);
  add(["S"], [".###.", "#...#", "#....", ".###.", "....#", "....#", "#...#", ".###."]);
  add(["T"], ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."]);
  add(["U"], ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."]);
  add(["V"], ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."]);
  add(["W"], ["#.....#", "#.....#", "#.....#", "#..#..#", "#..#..#", "#.#.#.#", "##...##", "#.....#"]);
  add(["X"], ["#...#", "#...#", ".#.#.", "..#..", "..#..", ".#.#.", "#...#", "#...#"]);
  add(["Y"], ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#..", "..#.."]);
  add(["Z"], ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#....", "#####"]);

  add(["λ", "Λ"], ["#....", "#....", ".#...", ".#...", "..#..", "..#..", ".#.#.", "#...#"]);
  add(["№"], ["#...##.", "##.#..#", "#.##..#", "#..#..#", "#...##.", ".......", "#######", "......."]);
  add(["."], [".", ".", ".", ".", ".", ".", ".", "#"]);
  add([","], ["..", "..", "..", "..", "..", "..", ".#", "#."]);
  add([":"], [".", ".", "#", ".", ".", ".", "#", "."]);
  add(["/"], ["...#", "...#", "..#.", "..#.", ".#..", ".#..", "#...", "#..."]);
  add(["+"], [".....", "..#..", "..#..", "#####", "..#..", "..#..", ".....", "....."]);
  add(["-"], ["....", "....", "....", "####", "....", "....", "....", "...."]);
  add(["%"], ["##...", "##..#", "...#.", "...#.", "..#..", ".#...", "#..##", "...##"]);
  add(["="], [".....", ".....", "#####", ".....", "#####", ".....", ".....", "....."]);
  add(["_"], [".....", ".....", ".....", ".....", ".....", ".....", ".....", "#####"]);
  add(["["], ["###", "#..", "#..", "#..", "#..", "#..", "#..", "###"]);
  add(["]"], ["###", "..#", "..#", "..#", "..#", "..#", "..#", "###"]);
  add(["?"], [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#..", "....."]);
  add([";"], [".", ".", "#", ".", ".", ".", "#", "."]);
  add(["("], ["..##", ".#..", "#...", "#...", "#...", "#...", ".#..", "..##"]);
  add([")"], ["##..", "..#.", "...#", "...#", "...#", "...#", "..#.", "##.."]);
  add([" "], ["...", "...", "...", "...", "...", "...", "...", "..."]);


  const cyrillicUpper = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
  const cyrillicLower = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя";

  Object.assign(map, extractVariant2LowercaseGlyphs(glyphSpecificationRaw));
  return map;
})();

function normalizeBitmapChar(char) {
  return String(char ?? "").normalize("NFC");
}

function splitBitmapText(text) {
  const glyphs = [];
  let current = "";

  Array.from(String(text ?? "")).forEach((char) => {
    if (COMBINING_MARK_RE.test(char) && current) {
      current += char;
      return;
    }

    if (current) glyphs.push(current);
    current = char;
  });

  if (current) glyphs.push(current);
  return glyphs;
}

function createEmptyGlyph(width) {
  return Array.from({ length: GLYPH_H }, () => Array.from({ length: width }, () => 0));
}

function cloneGlyph(glyph) {
  return glyph.map((row) => [...row]);
}

function getGlyphVerticalBounds(glyph) {
  let top = GLYPH_H;
  let bottom = -1;

  glyph.forEach((row, rowIndex) => {
    if (!row.some(Boolean)) return;
    top = Math.min(top, rowIndex);
    bottom = Math.max(bottom, rowIndex);
  });

  if (bottom < 0) return { top: 0, bottom: 0 };
  return { top, bottom };
}

function overlayGlyph(target, glyph, yOffset = 0) {
  glyph.forEach((row, rowIndex) => {
    const targetRow = rowIndex + yOffset;
    if (targetRow < 0 || targetRow >= GLYPH_H) return;
    row.forEach((value, colIndex) => {
      if (value) target[targetRow][colIndex] = 1;
    });
  });
}

function overlayRows(target, rows, yOffset) {
  rows.forEach((row, rowIndex) => {
    const targetRow = rowIndex + yOffset;
    if (targetRow < 0 || targetRow >= GLYPH_H) return;
    row.forEach((value, colIndex) => {
      if (value) target[targetRow][colIndex] = 1;
    });
  });
}

function buildAbsoluteRow(width, indexes) {
  const row = Array.from({ length: width }, () => 0);
  indexes
    .filter((index) => Number.isInteger(index) && index >= 0 && index < width)
    .forEach((index) => {
      row[index] = 1;
    });
  return row;
}

function getCenteredColumns(start, end, count) {
  const safeCount = Math.max(1, Math.min(count, end - start + 1));
  const offset = Math.floor(((end - start + 1) - safeCount) / 2);
  return Array.from({ length: safeCount }, (_, index) => start + offset + index);
}

function getGlyphBaseBitmap(char) {
  if (char === "ı") return DOTLESS_I_GLYPH;
  return FONT_BITMAP[normalizeBitmapChar(char)] || null;
}

function buildCombiningMark(mark, glyph) {
  const width = glyph[0]?.length ?? 1;
  const { start, end, width: visibleWidth } = getGlyphVisibleBounds(glyph);
  const center = Math.floor((start + end) / 2);
  const left = start;
  const right = end;
  const above = (indexesRows) => ({ placement: "above", rows: indexesRows.map((indexes) => buildAbsoluteRow(width, indexes)) });
  const below = (indexesRows) => ({ placement: "below", rows: indexesRows.map((indexes) => buildAbsoluteRow(width, indexes)) });

  switch (mark) {
    case "\u0307":
      return above([[center]]);
    case "\u0308": {
      const inset = visibleWidth <= 4 ? 0 : Math.floor((visibleWidth - 2) / 3);
      return above([[left + inset, right - inset]]);
    }
    case "\u0306":
      return above([getCenteredColumns(left, right, visibleWidth >= 5 ? 3 : 2)]);
    case "\u0301":
      return above([[Math.min(right, center + (visibleWidth > 2 ? 1 : 0))], [center]]);
    case "\u0300":
      return above([[Math.max(left, center - (visibleWidth > 2 ? 1 : 0))], [center]]);
    case "\u0302":
      return above([[center], [Math.max(left, center - 1), Math.min(right, center + 1)]]);
    case "\u030C":
      return above([[Math.max(left, center - 1), Math.min(right, center + 1)], [center]]);
    case "\u0303":
      return above([[left, center], [center, right]]);
    case "\u030A":
      return above([[center], [Math.max(left, center - 1), Math.min(right, center + 1)]]);
    case "\u0327":
      return below([[center], [Math.max(0, center - 1)]]);
    case "\u0328":
      return below([[center], [Math.min(width - 1, center + 1)]]);
    default:
      return null;
  }
}

function applyCombiningMark(glyph, mark) {
  const descriptor = buildCombiningMark(mark, glyph);
  if (!descriptor) return null;

  const accentHeight = descriptor.rows.length;
  const width = glyph[0]?.length ?? 1;
  let nextGlyph = cloneGlyph(glyph);
  let bounds = getGlyphVerticalBounds(nextGlyph);

  if (descriptor.placement === "above") {
    if (bounds.top < accentHeight) {
      const shiftedGlyph = createEmptyGlyph(width);
      overlayGlyph(shiftedGlyph, nextGlyph, accentHeight);
      nextGlyph = shiftedGlyph;
      bounds = getGlyphVerticalBounds(nextGlyph);
    }

    overlayRows(nextGlyph, descriptor.rows, Math.max(0, bounds.top - accentHeight));
    return nextGlyph;
  }

  if (GLYPH_H - 1 - bounds.bottom < accentHeight) {
    const shiftedGlyph = createEmptyGlyph(width);
    overlayGlyph(shiftedGlyph, nextGlyph, -accentHeight);
    nextGlyph = shiftedGlyph;
    bounds = getGlyphVerticalBounds(nextGlyph);
  }

  overlayRows(nextGlyph, descriptor.rows, Math.min(GLYPH_H - accentHeight, bounds.bottom + 1));
  return nextGlyph;
}

function getComposedGlyphBitmap(char) {
  const key = normalizeBitmapChar(char);
  if (COMPOSED_GLYPH_CACHE.has(key)) return COMPOSED_GLYPH_CACHE.get(key);

  if (EXPLICIT_GLYPH_OVERRIDES[key]) {
    COMPOSED_GLYPH_CACHE.set(key, EXPLICIT_GLYPH_OVERRIDES[key]);
    return EXPLICIT_GLYPH_OVERRIDES[key];
  }

  const parts = Array.from(key.normalize("NFD"));
  if (parts.length <= 1) return null;

  let [baseChar, ...marks] = parts;
  if (!marks.length) return null;

  if (baseChar === "i" && marks.some((mark) => mark !== "\u0327" && mark !== "\u0328")) {
    baseChar = "ı";
  }

  const baseGlyph = getGlyphBaseBitmap(baseChar);
  if (!baseGlyph) return null;

  let glyph = cloneGlyph(baseGlyph);
  for (const mark of marks) {
    glyph = applyCombiningMark(glyph, mark);
    if (!glyph) return null;
  }

  COMPOSED_GLYPH_CACHE.set(key, glyph);
  return glyph;
}

function isMonospaceBitmapGlyph(char, glyphWidth) {
  if (glyphWidth > 5) return false;
  const parts = Array.from(normalizeBitmapChar(char).normalize("NFD"));
  const baseChar = parts[0] ?? "";
  return /^[0-9]$/u.test(baseChar) || LETTER_BASE_RE.test(baseChar);
}

function getGlyphBitmap(char) {
  const key = normalizeBitmapChar(char);
  if (FORCED_COMPOSED_GLYPHS.has(key)) return getComposedGlyphBitmap(key) || UNKNOWN_GLYPH;
  return getGlyphBaseBitmap(key) || getComposedGlyphBitmap(key) || UNKNOWN_GLYPH;
}

function parseHexColor(hex) {
  const match = HEX_COLOR_RE.exec(hex);
  if (!match) return [0, 0, 0];
  const value = parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function getGlyphImageData(char, inverted = false) {
  const glyphKey = `${normalizeBitmapChar(char)}:${inverted ? 1 : 0}`;
  if (GLYPH_CACHE.has(glyphKey)) return GLYPH_CACHE.get(glyphKey);

  const glyph = getGlyphBitmap(char);
  const width = glyph[0]?.length ?? 5;
  const pixels = new Uint8ClampedArray(width * GLYPH_H * 4);
  const [r, g, b] = parseHexColor(inverted ? LCD_BG : LCD_FG);

  glyph.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (!value) return;
      const pixelIndex = (rowIndex * width + colIndex) * 4;
      pixels[pixelIndex] = r;
      pixels[pixelIndex + 1] = g;
      pixels[pixelIndex + 2] = b;
      pixels[pixelIndex + 3] = 255;
    });
  });

  const imageData = new ImageData(pixels, width, GLYPH_H);
  GLYPH_CACHE.set(glyphKey, imageData);
  return imageData;
}

function drawBitmapGlyphSlice(ctx, glyph, x, y, startCol, endCol, inverted = false) {
  ctx.fillStyle = inverted ? LCD_BG : LCD_FG;
  glyph.forEach((row, rowIndex) => {
    for (let colIndex = startCol; colIndex <= endCol; colIndex += 1) {
      if (row[colIndex]) ctx.fillRect(x + colIndex - startCol, y + rowIndex, 1, 1);
    }
  });
}

function getGlyphVisibleBounds(glyph) {
  const width = glyph[0]?.length ?? 0;
  let start = width;
  let end = -1;

  glyph.forEach((row) => {
    row.forEach((value, colIndex) => {
      if (!value) return;
      start = Math.min(start, colIndex);
      end = Math.max(end, colIndex);
    });
  });

  if (end < 0) {
    return {
      start: 0,
      end: Math.max(0, width - 1),
      width: 0,
    };
  }

  return {
    start,
    end,
    width: end - start + 1,
  };
}

function getGlyphMetrics(char) {
  const key = normalizeBitmapChar(char);
  if (GLYPH_METRICS_CACHE.has(key)) return GLYPH_METRICS_CACHE.get(key);

  const glyph = getGlyphBitmap(char);
  const bounds = getGlyphVisibleBounds(glyph);
  const visibleWidth = char === " " ? 0 : Math.max(1, bounds.width || (glyph[0]?.length ?? 5));
  const advance = char === " "
    ? SPACE_W
    : isMonospaceBitmapGlyph(char, visibleWidth)
      ? MONO_ADVANCE_W
      : visibleWidth + 1;
  const metrics = {
    advance,
    glyph,
    visibleEnd: bounds.end,
    visibleStart: bounds.start,
    visibleWidth,
  };

  GLYPH_METRICS_CACHE.set(key, metrics);
  return metrics;
}

function forEachBitmapGlyph(text, { startX = 0, maxX = Number.POSITIVE_INFINITY } = {}, visitor) {
  const chars = splitBitmapText(text);
  let cursorX = startX;

  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index];
    const metrics = getGlyphMetrics(char);
    const extraSpace = Math.max(0, metrics.advance - metrics.visibleWidth);
    const leftPadding = char === " " || index === 0 ? 0 : Math.floor(extraSpace / 2);
    const drawX = cursorX + leftPadding;
    const drawWidth = char === " " ? 0 : metrics.visibleWidth;

    if (drawX + drawWidth > maxX) break;

    visitor({
      ...metrics,
      char,
      drawWidth,
      drawX,
      index,
    });

    cursorX += metrics.advance;
  }
}

function measureBitmapTextWidth(text) {
  let width = 0;

  forEachBitmapGlyph(text, {}, ({ drawWidth, drawX }) => {
    width = Math.max(width, drawX + drawWidth);
  });

  return width;
}

export function getUnmappedGlyphs(text) {
  return splitBitmapText(text).flatMap((char) => {
    if (char === " ") return [];
    if (getGlyphBaseBitmap(char) || getComposedGlyphBitmap(char)) return [];
    return [{ char, codepoint: `U+${char.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}` }];
  });
}

export function getRenderableRows(rows) {
  const trimmedRows = [...(rows ?? [])];
  while (trimmedRows.length && !String(trimmedRows[trimmedRows.length - 1]?.text ?? "").trim()) trimmedRows.pop();

  const nonEmptyCount = trimmedRows.filter((row) => String(row?.text ?? "").trim()).length;
  const rowStep = nonEmptyCount <= 5 ? GLYPH_H + 3 : GLYPH_H + 1;

  return trimmedRows.map((row, index) => {
    const text = String(row?.text ?? "").trimEnd();
    const x = Number.isFinite(row?.x) ? row.x : LCD_MARGIN;
    const y = Number.isFinite(row?.y) ? row.y : LCD_MARGIN + index * rowStep;
    const width = Math.max(1, measureBitmapTextWidth(text));

    return {
      ...row,
      text,
      x,
      y,
      width,
      height: GLYPH_H,
      unmappedGlyphs: getUnmappedGlyphs(text),
    };
  });
}

function drawBitmapText(ctx, text, x, y, inverted = false) {
  forEachBitmapGlyph(text, { startX: x, maxX: LCD_W - LCD_MARGIN }, ({ char, drawX, glyph, visibleEnd, visibleStart }) => {
    if (char === " ") return;
    drawBitmapGlyphSlice(ctx, glyph, drawX, y, visibleStart, visibleEnd, inverted);
  });
}

function drawBitmapPreview(ctx, text, { width = LCD_W, height = GLYPH_H + 4, invalidChars = [] } = {}) {
  const invalidSet = new Set((invalidChars ?? []).map((item) => item.char));
  const cursorY = 2;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  forEachBitmapGlyph(text, { startX: 2, maxX: width - 2 }, ({ char, drawWidth, drawX, glyph, visibleEnd, visibleStart }) => {
    if (invalidSet.has(char)) {
      ctx.fillStyle = "#fde68a";
      ctx.fillRect(drawX - 1, cursorY - 1, drawWidth + 2, GLYPH_H + 2);
    }

    if (char === " ") return;
    drawBitmapGlyphSlice(ctx, glyph, drawX, cursorY, visibleStart, visibleEnd, false);
  });
}

/**
 * Bitmap LCD renderer for the 128x64 simulator display.
 *
 * API:
 * - `render(ctx, rows, options)` draws the provided rows and returns normalized rows.
 * - `getUnmappedGlyphs(text)` reports characters missing from the bitmap font specification.
 */
export const LCDRenderer = {
  /**
   * Render LCD text rows to a bitmap canvas.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {Array<{text?: string, inverted?: boolean, x?: number, y?: number}>} rows
   * @param {{ editorEnabled?: boolean, selectedRowIndex?: number|null, titleUnderline?: boolean }} [options]
   * @returns {Array<{text: string, inverted?: boolean, x: number, y: number, width: number, height: number, unmappedGlyphs: Array<{char: string, codepoint: string}>}>}
   */
  render(ctx, rows, { editorEnabled = false, selectedRowIndex = null, titleUnderline = false } = {}) {
    const renderableRows = getRenderableRows(rows);

    ctx.fillStyle = LCD_BG;
    ctx.fillRect(0, 0, LCD_W, LCD_H);

    renderableRows.forEach((row, rowIndex) => {
      if (row.y + GLYPH_H > LCD_H - LCD_MARGIN) return;
      const inverted = titleUnderline && rowIndex === 0 ? false : Boolean(row.inverted);
      if (inverted) {
        ctx.fillStyle = LCD_FG;
        ctx.fillRect(row.x, row.y, Math.min(LCD_W - row.x - LCD_MARGIN, row.width), GLYPH_H);
      }
      drawBitmapText(ctx, row.text, row.x, row.y, inverted);

      if (editorEnabled && selectedRowIndex === rowIndex) {
        ctx.strokeStyle = "#dc2626";
        ctx.lineWidth = 1;
        ctx.strokeRect(row.x - 1.5, row.y - 1.5, Math.max(4, row.width + 3), GLYPH_H + 3);
      }
    });

    if (titleUnderline && renderableRows[0]) {
      ctx.fillStyle = LCD_FG;
      const underlineY = Math.min(LCD_H - 1, renderableRows[0].y + TITLE_UNDERLINE_OFFSET);
      ctx.fillRect(0, underlineY, LCD_W, 1);
    }

    ctx.strokeStyle = LCD_FG;
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, LCD_W - 1, LCD_H - 1);

    return renderableRows;
  },
  getUnmappedGlyphs,
  renderTextPreview(ctx, text, options) {
    drawBitmapPreview(ctx, text, options);
  },
};

export function serializeBitmapFontDefinition() {
  return JSON.stringify(
    {
      format: "ecros-5400uv-bitmap-font",
      glyphHeight: GLYPH_H,
      glyphs: FONT_BITMAP,
    },
    null,
    2,
  );
}

function getSampleLabel(device) {
  return (
    {
      reference: "ЭТАЛОН",
      sampleA: "ОБРАЗЕЦ 1",
      holmium: "ХОЛЬМИЙ",
      kinetic: "КИНЕТИКА",
      empty: "ПУСТО",
    }[device.currentSample] ?? "-"
  );
}

function getMultiwaveValueLabel(device) {
  return MENU_PHOTOMETRY_VALUE[device.multiwave?.valueIndex ?? 0] ?? "А";
}

function formatMultiwaveResult(item, valueIndex) {
  if (valueIndex === 1) return `λ${item.index} ${item.wavelength.toFixed(1)} T=${item.t.toFixed(1)}`.slice(0, 20);
  if (valueIndex === 2) return `λ${item.index} ${item.wavelength.toFixed(1)} E${item.energy}`.slice(0, 20);
  return `λ${item.index} ${item.wavelength.toFixed(1)} A=${item.a.toFixed(3)}`.slice(0, 20);
}

function withPauseBanner(rows, paused) {
  if (!paused || !rows.length) return rows;
  const nextRows = [...rows];
  nextRows[0] = { text: pad("ПАУЗА ЭМУЛЯТОРА"), inverted: true };
  return nextRows;
}

export function getLcdRows(device) {
  const rows = [];
  const push = (text, inverted = false) => rows.push({ text: pad(text), inverted });

  if (device.busy) {
    push("");
    push(center(device.busyLabel));
    push("");
    push(center("ИДЕТ ОПЕРАЦИЯ"));
    push("");
    return rows;
  }

  if (device.screen === "boot") {
    push("");
    push(center("ЭКРОС-5400УФ"));
    push("");
    push(center("ДОБРО ПОЖАЛОВАТЬ"));
    return rows;
  }

  if (device.screen === "diagnostic") {
    const items = ["ФИЛЬТРЫ", "ЛАМПЫ", "ДЕТЕКТОР", "Д2-ЛАМПА", "В-ЛАМПА", "КАЛИБР. ЛЯМ", "ТЕМН. ТОК"];
    push("ДИАГНОСТИКА", true);
    items.forEach((item, index) => {
      const status = index < device.diagIndex ? "ОК" : index === device.diagIndex ? "..." : "--";
      push(`${item} ${status}`);
    });
    return withPauseBanner(rows, device.emulatorPaused);
  }

  if (device.screen === "warmup") {
    push("Прогрев", true);
    push("ESC - Пропуск");
    push("");
    push(center(formatMmSs(device.warmupRemaining)));
    return withPauseBanner(rows, device.emulatorPaused);
  }

  if (device.screen === "warning") {
    push(center("ПРЕДУПРЕЖДЕНИЕ"), true);
    push(center(device.warning?.title || "ВНИМАНИЕ"));
    const parts = String(device.warning?.body || "").match(/.{1,18}/g) || [""];
    parts.slice(0, 2).forEach((part) => push(center(part)));
    push(center("ВВОД / ESC"));
    return withPauseBanner(rows, device.emulatorPaused);
  }

  if (device.screen === "input") {
    push((device.dialogTitle || "ВВЕДИТЕ ЗНАЧЕНИЕ").toUpperCase(), true);
    push("");
    push(center(device.inputBuffer || "_"));
    push("0-9 . - УДАЛИТЬ");
    push("ВВОД - ПРИНЯТЬ");
    push("ESC - ОТМЕНА");
    return withPauseBanner(rows, device.emulatorPaused);
  }

  if (device.screen === "saveDialog") {
    push("СОХРАНИТЬ ФАЙЛ", true);
    push(`ТИП ${device.saveMeta.group}`);
    push(`${device.inputBuffer || "_"}${device.saveMeta.suggestedExt}`);
    push("ИМЯ ВРУЧНУЮ");
    push("ВВОД - СОХРАНИТЬ");
    push("ESC - ОТМЕНА");
    return withPauseBanner(rows, device.emulatorPaused);
  }

  if (device.screen === "main") {
    push("ГЛАВНОЕ МЕНЮ", true);
    MENU_MAIN.forEach((item, index) => push(item, device.mainIndex === index));
    push(`${device.wavelength.toFixed(1)} НМ`);
    push(getSampleLabel(device));
    return withPauseBanner(rows, device.emulatorPaused);
  }

  if (device.screen === "fileRoot") {
    push("ФАЙЛОВЫЙ МЕНЕДЖЕР", true);
    FILE_GROUPS.forEach((item, index) => push(item, device.fileRootIndex === index));
    push("ВВОД - ОТКРЫТЬ");
    push("ESC - НАЗАД");
    return withPauseBanner(rows, device.emulatorPaused);
  }

  if (device.screen === "fileList") {
    const group = device.fileContext.group;
    const files = device.files[group] || [];
    push(`ФАЙЛЫ ${group}`, true);
    if (!files.length) {
      push("ПУСТО", true);
      push("ESC - НАЗАД");
      return withPauseBanner(rows, device.emulatorPaused);
    }
    const start = Math.floor(device.fileListIndex / 4) * 4;
    files.slice(start, start + 4).forEach((file, index) => {
      const fileIndex = start + index;
      push(`${file.name}${file.ext}`.slice(0, 20), device.fileListIndex === fileIndex);
    });
    push("ВВОД - ДЕЙСТВИЯ");
    push("ESC - НАЗАД");
    return withPauseBanner(rows, device.emulatorPaused);
  }

  if (device.screen === "fileActionMenu") {
    const selected = (device.files[device.fileContext.group] || [])[device.fileListIndex];
    push(center(selected ? `${selected.name}${selected.ext}` : "ФАЙЛ"), true);
    FILE_ACTIONS.forEach((action, index) => push(action, device.fileActionIndex === index));
    push("ВВОД - ВЫБРАТЬ");
    push("ESC - ОТМЕНА");
    return withPauseBanner(rows, device.emulatorPaused);
  }

  if (device.screen === "photometryValue") {
    push("ФОТОМЕТРИЯ", true);
    MENU_PHOTOMETRY_VALUE.forEach((item, index) => push(item, device.photometryValueIndex === index));
    push("ВВОД - ВЫБРАТЬ");
    push("ESC - НАЗАД");
    return withPauseBanner(rows, device.emulatorPaused);
  }

  if (device.screen === "quantUnits") {
    push("ЕДИНИЦЫ", true);
    const start = Math.floor(device.unitsIndex / 4) * 4;
    UNITS.slice(start, start + 4).forEach((item, index) => {
      const unitIndex = start + index;
      push(item, device.unitsIndex === unitIndex);
    });
    push("ВВОД - ВЫБРАТЬ");
    push("ESC - НАЗАД");
    return withPauseBanner(rows, device.emulatorPaused);
  }

  if (device.screen === "quantMain") {
    push("КОЛИЧ. АНАЛИЗ", true);
    MENU_QUANT.forEach((item, index) => push(item, device.quantIndex === index));
    push(`K=${device.quantK.toFixed(3)}`);
    push(`L=${(device.cuvetteLengthMm ?? 10).toFixed(1)} ММ`);
    return withPauseBanner(rows, device.emulatorPaused);
  }

  if (device.screen === "quantCoef") {
    const concentration = device.quantK * device.lastComputedA + device.quantB;
    push("КОЭФФИЦИЕНТ", true);
    push(`${device.wavelength.toFixed(1)} НМ`);
    push(`A=${device.lastComputedA.toFixed(3)} C=${concentration.toFixed(3)}`.slice(0, 20));
    push(`K=${device.quantK.toFixed(3)}`);
    push(`B=${device.quantB.toFixed(3)}`);
    push(`L=${(device.cuvetteLengthMm ?? 10).toFixed(1)} MM`);
    push("START/ФАЙЛ/ESC");
    return withPauseBanner(rows, device.emulatorPaused);
  }

  if (device.screen === "calibrationSetupStandards") {
    push("НОВАЯ ГРАДУИР.", true);
    push("ЧИСЛО СТАНДАРТОВ");
    push(center(String(device.calibration.standards)), true);
    push("СТРЕЛКИ 1..9");
    push("ВВОД - ДАЛЕЕ");
    push("ESC - НАЗАД");
    return withPauseBanner(rows, device.emulatorPaused);
  }

  if (device.screen === "calibrationSetupParallels") {
    push("НОВАЯ ГРАДУИР.", true);
    push("ЧИСЛО ПАРАЛЛЕЛЕЙ");
    push(center(String(device.calibration.parallels)), true);
    push("СТРЕЛКИ 1..9");
    push("ВВОД - ПЛАН");
    push("ESC - НАЗАД");
    return withPauseBanner(rows, device.emulatorPaused);
  }

  if (device.screen === "calibrationPlan") {
    const step = device.calibration.plan[device.calibration.stepIndex];
    push("ПЛАН ИЗМЕРЕНИЙ", true);
    push(`СТАНД. ${device.calibration.standards}`);
    push(`ПАРАЛЛ. ${device.calibration.parallels}`);
    push(`СЛЕД. ${step?.code || "-"}`);
    push(`ГОТОВО ${getCalibrationDoneCount(device.calibration.plan)}/${device.calibration.plan.length}`);
    push("ВВОД - НАЧАТЬ");
    push("НОЛЬ - ОБНУЛИТЬ");
    push("ВНИЗ - ЖУРНАЛ");
    return withPauseBanner(rows, device.emulatorPaused);
  }

  if (device.screen === "calibrationStep") {
    const step = device.calibration.plan[device.calibration.stepIndex];
    push("НОВАЯ ГРАДУИР.", true);
    push(`ВСТАВЬТЕ ${step?.code || "С-1-1"}`);
    push(`СЕРИЯ ${step?.parallelIndex || 1}`);
    push(`СТАНДАРТ ${step?.standardIndex || 1}`);
    push("НОЛЬ - ОБНУЛИТЬ");
    push("START - ИЗМЕРИТЬ");
    push("ESC - ПЛАН");
    return withPauseBanner(rows, device.emulatorPaused);
  }

  if (device.screen === "calibrationJournal") {
    const resultIndexes = getCalibrationResultIndexes(device.calibration.plan);
    const cursor = resultIndexes.includes(device.calibration.resultCursor)
      ? device.calibration.resultCursor
      : resultIndexes[resultIndexes.length - 1] ?? 0;
    const cursorPos = Math.max(0, resultIndexes.indexOf(cursor));
    const start = Math.max(0, cursorPos - 2);
    const visibleIndexes = resultIndexes.slice(start, start + 3);

    push(`ЖУРНАЛ ${getCalibrationDoneCount(device.calibration.plan)}/${device.calibration.plan.length}`, true);
    if (!visibleIndexes.length) {
      push("НЕТ РЕЗУЛЬТАТОВ", true);
    } else {
      visibleIndexes.forEach((index) => {
        const step = device.calibration.plan[index];
        push(`${step.code} A=${step.result.a.toFixed(3)}`, index === cursor);
      });
    }
    push("ВВОД - ДАЛЕЕ");
    push("START - ПЕРЕМЕРИТЬ");
    push("ОЧИСТИТЬ - УДАЛ.");
    return withPauseBanner(rows, device.emulatorPaused);
  }

  if (device.screen === "calibrationGraph") {
    push("ГРАФИК ГРАДУИР.", true);
    push(`ГОТОВО ${getCalibrationDoneCount(device.calibration.plan)}/${device.calibration.plan.length}`);
    push("ESC - ЖУРНАЛ");
    push("ФАЙЛ - СОХРАНИТЬ");
    return withPauseBanner(rows, device.emulatorPaused);
  }

  if (device.screen === "kineticsMenu") {
    push("КИНЕТИКА", true);
    MENU_KINETICS.forEach((item, index) => push(item, device.kineticsIndex === index));
    push(`ВРЕМЯ=${device.kineticDuration}С`);
    push(`A ${device.kineticLower.toFixed(2)}..${device.kineticUpper.toFixed(2)}`.slice(0, 20));
    return withPauseBanner(rows, device.emulatorPaused);
  }

  if (device.screen === "kineticsRun") {
    push("КИНЕТИКА", true);
    push(`ВРЕМЯ=${device.kineticPoints.at(-1)?.time ?? 0}С`);
    push(`A=${device.lastComputedA.toFixed(3)}`);
    push(`%Т=${device.lastComputedT.toFixed(1)}`);
    push("ВНИЗ - ГРАФИК");
    push("START - СТОП");
    push("ESC - МЕНЮ");
    return withPauseBanner(rows, device.emulatorPaused);
  }

  if (device.screen === "multiwaveMenu") {
    push("МНОГОВОЛН. АНАЛИЗ", true);
    MENU_MULTIWAVE.forEach((item, index) => push(item, device.multiwave.editIndex === index));
    push(`N=${device.multiwave.waveCount} ${getMultiwaveValueLabel(device)}`.slice(0, 20));
    const activeWavelengths = device.multiwave.wavelengths
      .slice(0, device.multiwave.waveCount)
      .map((item) => (item == null ? "--" : item.toFixed(1)))
      .join(" ");
    push(activeWavelengths.slice(0, 20));
    push("ZERO/FILE/ESC");
    return withPauseBanner(rows, device.emulatorPaused);
  }

  if (device.screen === "multiwaveWaveCount") {
    push("МНОГОВОЛН. АНАЛИЗ", true);
    push("ЧИСЛО λ");
    push(center(String(device.multiwave.waveCount)), true);
    push("ДОПУСТИМО 2..4");
    push("ВВОД - РЕДАКТ.");
    push("ESC - НАЗАД");
    return withPauseBanner(rows, device.emulatorPaused);
  }

  if (device.screen === "multiwaveWaveEntry") {
    push("ДЛИНЫ ВОЛН", true);
    device.multiwave.wavelengths.slice(0, device.multiwave.waveCount).forEach((value, index) => {
      push(`λ${index + 1} ${value == null ? "--" : value.toFixed(1)} НМ`, device.multiwave.editIndex === index);
    });
    push("ВВОД - ИЗМЕНИТЬ");
    push("START - ИЗМЕРИТЬ");
    push("FILE / ESC");
    return withPauseBanner(rows, device.emulatorPaused);
  }

  if (device.screen === "multiwaveValue") {
    push("ВЕЛИЧИНА", true);
    MENU_PHOTOMETRY_VALUE.forEach((item, index) => push(item, device.multiwave.valueIndex === index));
    push("ВВОД - ВЫБРАТЬ");
    push("ESC - НАЗАД");
    return withPauseBanner(rows, device.emulatorPaused);
  }

  if (device.screen === "multiwaveResults") {
    push("МНОГОВОЛН. АНАЛИЗ", true);
    const results = device.multiwave.results || [];
    if (!results.length) {
      push("НЕТ РЕЗУЛЬТАТОВ", true);
    } else {
      results.forEach((item) => push(formatMultiwaveResult(item, device.multiwave.valueIndex)));
    }
    push("ФАЙЛ / ESC");
    return withPauseBanner(rows, device.emulatorPaused);
  }

  if (device.screen === "settings") {
    push("НАСТРОЙКИ", true);
    MENU_SETTINGS.forEach((item, index) => {
      const label =
        index === 0 ? `${item} ${device.d2Lamp ? "ВКЛ" : "ВЫКЛ"}` :
        index === 1 ? `${item} ${device.wLamp ? "ВКЛ" : "ВЫКЛ"}` :
        item;
      push(label, device.settingsIndex === index);
    });
    push(`ЩЕЛЬ=${device.slip} САМПЛ=${device.sampler}`);
    return withPauseBanner(rows, device.emulatorPaused);
  }

  if (device.screen === "version") {
    push("О СИСТЕМЕ", true);
    push("ЭКРОС-5400УФ");
    push(`ПО ${device.softwareVersion}`);
    push(`АП ${device.hardwareVersion}`);
    push(device.company);
    push("ВВОД/ESC - НАЗАД");
    return withPauseBanner(rows, device.emulatorPaused);
  }

  const valueLabel = MENU_PHOTOMETRY_VALUE[device.photometryValueIndex];
  const currentRows = device.measurements.slice(-3);
  push(`ФОТОМЕТРИЯ ${valueLabel}`, true);
  push(center(`${device.wavelength.toFixed(1)} НМ`));
  push(center(
    device.photometryValueIndex === 0
      ? `${device.lastComputedA.toFixed(3)} А`
      : device.photometryValueIndex === 1
        ? `${device.lastComputedT.toFixed(1)} %Т`
        : `${device.lastEnergy}`,
  ));
  push("--------------------");
  currentRows.forEach((measurement, localIndex) => {
    const globalIndex = Math.max(0, device.measurements.length - currentRows.length) + localIndex;
    const line = device.photometryValueIndex === 0
      ? `${measurement.index} ${measurement.wavelength.toFixed(1)} ${measurement.a.toFixed(3)}`
      : device.photometryValueIndex === 1
        ? `${measurement.index} ${measurement.wavelength.toFixed(1)} ${measurement.t.toFixed(1)}`
        : `${measurement.index} ${measurement.wavelength.toFixed(1)} ${measurement.energy}`;
    push(line, device.measurements.length > 0 && device.measurementCursor === globalIndex);
  });
  if (!device.measurements.length) push("НЕТ РЕЗУЛЬТАТОВ");
  push(device.measurements.length ? "ВНИЗ ПОСЛЕ СПИСКА" : "START - ИЗМЕРИТЬ");
  return withPauseBanner(rows, device.emulatorPaused);
}
