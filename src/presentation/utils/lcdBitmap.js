import { LCD_H, LCD_W } from "../../domain/constants/index.js";
import { getLcdRows } from "../../infrastructure/adapters/LcdRenderer.js";

export const LCD_FG = "#162033";
export const LCD_BG = "#eef4e6";
export const LCD_MARGIN = 3;
export const GLYPH_H = 8;
export const SPACE_W = 5;
export const LCD_TEXT_MAX_WIDTH = LCD_W - LCD_MARGIN * 2;

const GRAPH_X0 = 18;
const GRAPH_Y0 = 14;
const GRAPH_WIDTH = 96;
const GRAPH_HEIGHT = 36;
const LOWERCASE_TOP_ROW = 2;
const LOWERCASE_ASCENDERS = new Set(["b", "d", "f", "h", "i", "j", "k", "l", "t", "\u0431", "\u0439", "\u0451"]);

function createPixelMatrix(fill = 0) {
  return Array.from({ length: LCD_H }, () => Array.from({ length: LCD_W }, () => fill));
}

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

function padGlyphRows(glyph) {
  const width = glyph.reduce((max, row) => Math.max(max, row.length), 0);
  return glyph.map((row) => Array.from({ length: width }, (_, index) => row[index] ?? 0));
}

function isLowercaseGlyph(char) {
  return char.toLowerCase() === char && char.toUpperCase() !== char;
}

function getGlyphBounds(glyph) {
  let top = -1;
  let bottom = -1;
  glyph.forEach((row, rowIndex) => {
    if (row.some(Boolean)) {
      if (top === -1) top = rowIndex;
      bottom = rowIndex;
    }
  });
  return { top, bottom };
}

function shiftGlyphRows(glyph, targetTop) {
  const rows = padGlyphRows(glyph);
  const { top } = getGlyphBounds(rows);
  if (top < 0 || top === targetTop) return rows;

  const shift = targetTop - top;
  const width = rows[0]?.length ?? 0;
  const next = Array.from({ length: GLYPH_H }, () => Array.from({ length: width }, () => 0));

  rows.forEach((row, rowIndex) => {
    const nextIndex = rowIndex + shift;
    if (nextIndex >= 0 && nextIndex < GLYPH_H) next[nextIndex] = [...row];
  });

  return next;
}

function normalizeGlyphBitmap(char, glyph) {
  const rows = padGlyphRows(glyph);
  if (isLowercaseGlyph(char) && !LOWERCASE_ASCENDERS.has(char) && getGlyphBounds(rows).top > LOWERCASE_TOP_ROW) {
    return shiftGlyphRows(rows, LOWERCASE_TOP_ROW);
  }
  return rows;
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

  add(["\u0410", "A"], ["..#..", ".#.#.", ".#.#.", "#...#", "#...#", "#####", "#...#", "#...#"]);
  add(["\u0411"], ["#####", "#....", "#....", "####.", "#...#", "#...#", "#...#", "####."]);
  add(["\u0412", "B"], ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "#...#", "####."]);
  add(["\u0413"], ["#####", "#....", "#....", "#....", "#....", "#....", "#....", "#...."]);
  add(["\u0414"], ["..###..", "..#.#..", ".#...#.", ".#...#.", "#.....#", "#######", "#.....#", "#.....#"]);
  add(["\u0415", "E"], ["#####", "#....", "#....", "####.", "#....", "#....", "#....", "#####"]);
  add(["\u0401"], ["#####", "#....", "#....", "####.", "#....", "#....", "#....", "#####"]);
  add(["\u0416"], ["#..#..#", "#..#..#", ".#.#.#.", "..###..", "..###..", ".#.#.#.", "#..#..#", "#..#..#"]);
  add(["\u0417"], [".###.", "#...#", "....#", "..##.", "....#", "....#", "#...#", ".###."]);
  add(["\u0418"], ["#...#", "#...#", "#...#", "#..##", "#.#.#", "##..#", "#...#", "#...#"]);
  add(["\u0419"], ["..#..", ".#.#.", "#...#", "#...#", "#..##", "#.#.#", "##..#", "#...#"]);
  add(["\u041a", "K"], ["#...#", "#..#.", "#.#..", "##...", "##...", "#.#..", "#..#.", "#...#"]);
  add(["\u041b"], [".####", ".#..#", ".#..#", "#...#", "#...#", "#...#", "#...#", "#...#"]);
  add(["\u041c", "M"], ["#.....#", "##...##", "#.#.#.#", "#..#..#", "#.....#", "#.....#", "#.....#", "#.....#"]);
  add(["\u041d", "H"], ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#", "#...#"]);
  add(["\u041e", "O"], [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."]);
  add(["\u041f"], ["#####", "#...#", "#...#", "#...#", "#...#", "#...#", "#...#", "#...#"]);
  add(["\u0420", "P"], ["####.", "#...#", "#...#", "####.", "#....", "#....", "#....", "#...."]);
  add(["\u0421", "C"], [".###.", "#...#", "#....", "#....", "#....", "#....", "#...#", ".###."]);
  add(["\u0422", "T"], ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."]);
  add(["\u0423", "Y"], ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", ".#...", "#...."]);
  add(["\u0424"], ["...#...", "...#...", ".#####.", "#..#..#", "#..#..#", ".#####.", "...#...", "...#..."]);
  add(["\u0425", "X"], ["#...#", "#...#", ".#.#.", "..#..", "..#..", ".#.#.", "#...#", "#...#"]);
  add(["\u0426"], ["#....#", "#....#", "#....#", "#....#", "#....#", "#....#", "######", ".....#"]);
  add(["\u0427"], ["#...#", "#...#", "#...#", ".####", "....#", "....#", "....#", "....#"]);
  add(["\u0428"], ["#..#..#", "#..#..#", "#..#..#", "#..#..#", "#..#..#", "#..#..#", "#..#..#", "#######"]);
  add(["\u0429"], ["#..#..#", "#..#..#", "#..#..#", "#..#..#", "#..#..#", "#..#..#", "#######", "......#"]);
  add(["\u042a"], ["##....", ".#....", ".#....", ".####.", ".#...#", ".#...#", ".#...#", ".####."]);
  add(["\u042b"], ["#.....#", "#.....#", "#.....#", "####..#", "#...#.#", "#...#.#", "#...#.#", "####..#"]);
  add(["\u042c"], ["#....", "#....", "#....", "####.", "#...#", "#...#", "#...#", "####."]);
  add(["\u042d"], [".###.", "#...#", "....#", "....#", "..###", "....#", "#...#", ".###."]);
  add(["\u042e"], ["#...##.", "#..#..#", "#..#..#", "####..#", "#..#..#", "#..#..#", "#..#..#", "#...##."]);
  add(["\u042f"], [".####", "#...#", "#...#", ".####", "..#.#", ".#..#", "#...#", "#...#"]);

  add(["\u0430"], [".....", ".....", ".##..", "#..#.", "####.", "#..#.", "#..#.", "....."]);
  add(["\u0431"], [".###.", "#....", "####.", "#...#", "####.", "#...#", "#...#", ".###."]);
  add(["\u0432"], [".....", ".....", "####.", "#...#", "####.", "#...#", "#...#", "####."]);
  add(["\u0433"], [".....", ".....", "#####", "#....", "#....", "#....", "#....", "#...."]);
  add(["\u0434"], [".....", ".###..", ".#.#..", "#...#.", "#...#.", "#####.", "#...#.", "#...#."]);
  add(["\u0435", "e"], [".....", ".....", ".###.", "#...#", "#####", "#....", "#...#", ".###."]);
  add(["\u0451"], [".#.#.", ".....", ".###.", "#...#", "#####", "#....", "#...#", ".###."]);
  add(["\u0436"], [".....", ".....", "#.#.#", "#.#.#", ".###.", "#.#.#", "#.#.#", "#.#.#"]);
  add(["\u0437"], [".....", ".....", ".####", "....#", "..##.", "....#", "#...#", ".###."]);
  add(["\u0438"], [".....", ".....", "#...#", "#..##", "#.#.#", "##..#", "#...#", "#...#"]);
  add(["\u0439"], ["..#..", ".#.#.", ".....", "#...#", "#...#", "#.#.#", "##..#", "#...#"]);
  add(["\u043a"], [".....", ".....", "#...#", "#..#.", "###..", "#..#.", "#...#", "#...#"]);
  add(["\u043b"], [".....", ".....", ".###.", ".#..#", "#...#", "#...#", "#...#", "....."]);
  add(["\u043c"], [".....", ".....", "#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#"]);
  add(["\u043d"], [".....", ".....", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"]);
  add(["\u043e", "o"], [".....", ".....", ".###.", "#...#", "#...#", "#...#", "#...#", ".###."]);
  add(["\u043f"], [".....", ".....", "#####", "#...#", "#...#", "#...#", "#...#", "#...#"]);
  add(["\u0440"], [".....", ".....", "####.", "#...#", "#...#", "####.", "#....", "#...."]);
  add(["\u0441", "c"], [".....", ".....", ".###.", "#...#", "#....", "#....", "#...#", ".###."]);
  add(["\u0442"], [".....", ".....", "#####", "..#..", "..#..", "..#..", "..#..", "..#.."]);
  add(["\u0443"], [".....", ".....", "#...#", "#...#", ".####", "....#", "#...#", ".###."]);
  add(["\u0444"], [".....", "..#..", ".###.", "#.#.#", "#.#.#", ".###.", "..#..", "....."]);
  add(["\u0445", "x"], [".....", ".....", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"]);
  add(["\u0446"], [".....", ".....", "#...#", "#...#", "#...#", "#...#", "#####", "....#"]);
  add(["\u0447"], [".....", ".....", "#...#", "#...#", ".####", "....#", "....#", "....#"]);
  add(["\u0448"], [".....", ".....", "#.#.#", "#.#.#", "#.#.#", "#.#.#", "#.#.#", "#####"]);
  add(["\u0449"], [".....", ".....", "#.#.#", "#.#.#", "#.#.#", "#.#.#", "#####", "....#"]);
  add(["\u044a"], [".....", ".....", "##...", ".#...", ".####", ".#..#", ".#..#", ".####"]);
  add(["\u044b"], [".....", ".....", "#...#", "#...#", "#####", "#.#.#", "#.#.#", "#.#.#"]);
  add(["\u044c"], [".....", ".....", "#....", "#....", "####.", "#...#", "#...#", "####."]);
  add(["\u044d"], [".....", ".....", ".###.", "#...#", "..###", "....#", "#...#", ".###."]);
  add(["\u044e"], ["......", "......", "#..##.", "#.#..#", "#####.", "#.#..#", "#.#..#", "#..##."]);
  add(["\u044f"], [".....", ".....", ".####", "#...#", ".####", "..#.#", ".#..#", "#...#"]);

  add(["D"], ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "#...#", "####."]);
  add(["F"], ["#####", "#....", "#....", "####.", "#....", "#....", "#....", "#...."]);
  add(["G"], [".###.", "#...#", "#....", "#....", "#.###", "#...#", "#...#", ".###."]);
  add(["I"], ["###", ".#.", ".#.", ".#.", ".#.", ".#.", ".#.", "###"]);
  add(["J"], ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", "#..#.", ".##.."]);
  add(["L"], ["#....", "#....", "#....", "#....", "#....", "#....", "#....", "#####"]);
  add(["N"], ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#", "#...#"]);
  add(["Q"], [".###.", "#...#", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"]);
  add(["R"], ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#", "#...#"]);
  add(["S"], [".###.", "#...#", "#....", ".###.", "....#", "....#", "#...#", ".###."]);
  add(["U"], ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."]);
  add(["V"], ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."]);
  add(["W"], ["#.....#", "#.....#", "#.....#", "#..#..#", "#..#..#", "#.#.#.#", "##...##", "#.....#"]);
  add(["Z"], ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#....", "#####"]);

  add(["a"], [".....", ".....", ".###.", "....#", ".####", "#...#", "#..##", ".##.#"]);
  add(["b"], ["#....", "#....", "#.##.", "##..#", "#...#", "#...#", "##..#", "#.##."]);
  add(["d"], ["....#", "....#", ".##.#", "#..##", "#...#", "#...#", "#..##", ".##.#"]);
  add(["f"], ["..##.", ".#..#", ".#...", "###..", ".#...", ".#...", ".#...", ".#..."]);
  add(["g"], [".....", ".##.#", "#..##", "#...#", "#...#", ".####", "....#", ".###."]);
  add(["h"], ["#....", "#....", "#.##.", "##..#", "#...#", "#...#", "#...#", "#...#"]);
  add(["i"], ["..#..", ".....", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."]);
  add(["j"], ["...#.", ".....", "..##.", "...#.", "...#.", "...#.", "#..#.", ".##.."]);
  add(["k"], ["#....", "#....", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"]);
  add(["l"], [".##..", "..#..", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."]);
  add(["m"], [".....", ".....", "##.##", "#.#.#", "#.#.#", "#.#.#", "#.#.#", "#.#.#"]);
  add(["n"], [".....", ".....", "#.##.", "##..#", "#...#", "#...#", "#...#", "#...#"]);
  add(["p"], [".....", ".....", "####.", "#...#", "#...#", "####.", "#....", "#...."]);
  add(["q"], [".....", ".....", ".##.#", "#..##", "#...#", ".####", "....#", "....#"]);
  add(["r"], [".....", ".....", "#.##.", "##..#", "#....", "#....", "#....", "#...."]);
  add(["s"], [".....", ".....", ".####", "#....", ".###.", "....#", "....#", "####."]);
  add(["t"], [".#...", ".#...", "###..", ".#...", ".#...", ".#...", ".#..#", "..##."]);
  add(["u"], [".....", ".....", "#...#", "#...#", "#...#", "#...#", "#..##", ".##.#"]);
  add(["v"], [".....", ".....", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."]);
  add(["w"], [".....", ".....", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"]);
  add(["y"], [".....", ".....", "#...#", "#...#", "#...#", ".####", "....#", ".###."]);
  add(["z"], [".....", ".....", "#####", "...#.", "..#..", ".#...", "#....", "#####"]);

  add(["\u039b", "\u03bb"], ["#....", "#....", ".#...", ".#...", "..#..", "..#..", ".#.#.", "#...#"]);
  add(["\u2116"], ["#...##.", "##.#..#", "#.##..#", "#..#..#", "#...##.", ".......", "#######", "......."]);
  add(["."], [".", ".", ".", ".", ".", ".", ".", "#"]);
  add([","], ["..", "..", "..", "..", "..", "..", ".#", "#."]);
  add([":"], [".", ".", "#", ".", ".", ".", "#", "."]);
  add(["/"], ["...#", "...#", "..#.", "..#.", ".#..", ".#..", "#...", "#..."]);
  add(["+"], [".....", "..#..", "..#..", "#####", "..#..", "..#..", ".....", "....."]);
  add(["-"], [".....", ".....", ".....", "#####", ".....", ".....", ".....", "....."]);
  add(["%"], ["##...", "##..#", "...#.", "...#.", "..#..", ".#...", "#..##", "...##"]);
  add(["="], [".....", ".....", "#####", ".....", "#####", ".....", ".....", "....."]);
  add(["_"], [".....", ".....", ".....", ".....", ".....", ".....", ".....", "#####"]);
  add(["["], ["###", "#..", "#..", "#..", "#..", "#..", "#..", "###"]);
  add(["]"], ["###", "..#", "..#", "..#", "..#", "..#", "..#", "###"]);
  add(["?"], [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#..", "....."]);
  add([";"], [".", ".", "#", ".", ".", ".", "#", "."]);
  add([" "], ["...", "...", "...", "...", "...", "...", "...", "..."]);

  return Object.fromEntries(
    Object.entries(map).map(([char, glyph]) => [char, normalizeGlyphBitmap(char, glyph)]),
  );
})();

export function normalizeFontChar(char) {
  if (FONT_BITMAP[char]) return char;
  const lower = char.toLowerCase();
  if (FONT_BITMAP[lower]) return lower;
  const upper = char.toUpperCase();
  if (FONT_BITMAP[upper]) return upper;
  return char;
}

export function getGlyphBitmap(char) {
  const key = normalizeFontChar(char);
  return FONT_BITMAP[key] || UNKNOWN_GLYPH;
}

export function getGlyphVerticalMetrics(char) {
  return getGlyphBounds(getGlyphBitmap(char));
}

export function measureBitmapTextWidth(text) {
  let cursorX = 0;
  Array.from(text).forEach((char) => {
    const glyph = getGlyphBitmap(char);
    const glyphWidth = glyph[0]?.length ?? 5;
    cursorX += char === " " ? SPACE_W : glyphWidth + 1;
  });
  return Math.max(0, cursorX > 0 ? cursorX - 1 : 0);
}

function setPixel(matrix, x, y, value = 1) {
  if (x < 0 || y < 0 || x >= LCD_W || y >= LCD_H) return;
  matrix[y][x] = value;
}

function fillRect(matrix, x, y, width, height, value = 1) {
  for (let py = y; py < y + height; py += 1) {
    for (let px = x; px < x + width; px += 1) {
      setPixel(matrix, px, py, value);
    }
  }
}

function strokeRect(matrix, x, y, width, height, value = 1) {
  for (let px = x; px < x + width; px += 1) {
    setPixel(matrix, px, y, value);
    setPixel(matrix, px, y + height - 1, value);
  }
  for (let py = y; py < y + height; py += 1) {
    setPixel(matrix, x, py, value);
    setPixel(matrix, x + width - 1, py, value);
  }
}

function drawBitmapGlyph(matrix, glyph, x, y, inverted = false) {
  glyph.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (value) setPixel(matrix, x + colIndex, y + rowIndex, inverted ? 0 : 1);
    });
  });
}

function drawBitmapText(matrix, text, x, y, inverted = false) {
  let cursorX = x;
  const maxX = LCD_W - LCD_MARGIN;

  Array.from(text).forEach((char) => {
    const glyph = getGlyphBitmap(char);
    const glyphWidth = glyph[0]?.length ?? 5;
    if (cursorX + glyphWidth > maxX) return;
    drawBitmapGlyph(matrix, glyph, cursorX, y, inverted);
    cursorX += char === " " ? SPACE_W : glyphWidth + 1;
  });
}

export function renderRowsToMatrix(rows) {
  const matrix = createPixelMatrix(0);
  const trimmedRows = [...rows];
  while (trimmedRows.length && !trimmedRows[trimmedRows.length - 1].text.trim()) trimmedRows.pop();

  const nonEmptyCount = trimmedRows.filter((row) => row.text.trim()).length;
  const rowStep = nonEmptyCount <= 5 ? GLYPH_H + 3 : GLYPH_H + 1;

  trimmedRows.forEach((row, rowIndex) => {
    const y = LCD_MARGIN + rowIndex * rowStep;
    if (y + GLYPH_H > LCD_H - LCD_MARGIN) return;
    if (row.inverted) fillRect(matrix, LCD_MARGIN, y, LCD_W - LCD_MARGIN * 2, GLYPH_H, 1);
    drawBitmapText(matrix, row.text.trimEnd(), LCD_MARGIN, y, row.inverted);
  });

  strokeRect(matrix, 0, 0, LCD_W, LCD_H, 1);
  return matrix;
}

function drawLine(matrix, x0, y0, x1, y1) {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const targetX = Math.round(x1);
  const targetY = Math.round(y1);
  const dx = Math.abs(targetX - x);
  const dy = Math.abs(targetY - y);
  const sx = x < targetX ? 1 : -1;
  const sy = y < targetY ? 1 : -1;
  let err = dx - dy;

  let drawing = true;
  while (drawing) {
    setPixel(matrix, x, y, 1);
    if (x === targetX && y === targetY) {
      drawing = false;
      continue;
    }
    const e2 = err * 2;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

export function renderGraphToMatrix(values, { minY, maxY, title, xLabel, yLabel }) {
  const matrix = createPixelMatrix(0);
  strokeRect(matrix, GRAPH_X0, GRAPH_Y0, GRAPH_WIDTH, GRAPH_HEIGHT, 1);

  const titleText = title.slice(0, 16);
  const titleX = Math.max(LCD_MARGIN, Math.floor((LCD_W - measureBitmapTextWidth(titleText)) / 2));
  drawBitmapText(matrix, titleText, titleX, LCD_MARGIN, false);

  const maxLabel = String(maxY.toFixed(2)).slice(0, 5);
  const minLabel = String(minY.toFixed(2)).slice(0, 5);
  drawBitmapText(matrix, maxLabel, LCD_MARGIN, GRAPH_Y0 + 1, false);
  drawBitmapText(matrix, minLabel, LCD_MARGIN, GRAPH_Y0 + GRAPH_HEIGHT - 7, false);
  drawBitmapText(matrix, yLabel.slice(0, 1), GRAPH_X0 - 9, Math.max(LCD_MARGIN + GLYPH_H + 1, GRAPH_Y0 + Math.floor(GRAPH_HEIGHT / 2) - 4), false);
  drawBitmapText(matrix, xLabel.slice(0, 2), GRAPH_X0 + GRAPH_WIDTH - 13, GRAPH_Y0 + GRAPH_HEIGHT + 2, false);

  if (!values.length) {
    drawBitmapText(matrix, "НЕТ ДАННЫХ", 28, 30, false);
    strokeRect(matrix, 0, 0, LCD_W, LCD_H, 1);
    return matrix;
  }

  const safeMin = Number.isFinite(minY) ? minY : Math.min(...values);
  const safeMax = Number.isFinite(maxY) ? maxY : Math.max(...values) || safeMin + 1;
  const range = Math.max(0.0001, safeMax - safeMin);
  const points = values.map((value, index) => ({
    x: GRAPH_X0 + (index / Math.max(1, values.length - 1)) * (GRAPH_WIDTH - 3) + 1,
    y: GRAPH_Y0 + GRAPH_HEIGHT - 2 - ((value - safeMin) / range) * (GRAPH_HEIGHT - 3),
  }));

  points.forEach((point, index) => {
    if (index > 0) drawLine(matrix, points[index - 1].x, points[index - 1].y, point.x, point.y);
    fillRect(matrix, Math.round(point.x) - 1, Math.round(point.y) - 1, 3, 3, 1);
  });

  strokeRect(matrix, 0, 0, LCD_W, LCD_H, 1);
  return matrix;
}

export function renderDeviceToMatrix(device, rowsOverride = null) {
  if (!rowsOverride && device.screen === "photometryGraph") {
    return renderGraphToMatrix(device.measurements.map((measurement) => measurement.a), {
      minY: 0,
      maxY: Math.max(1, ...device.measurements.map((measurement) => measurement.a), 1),
      title: "ГРАФИК ФОТОМЕТР.",
      xLabel: "№",
      yLabel: "A",
    });
  }

  if (!rowsOverride && device.screen === "kineticsGraph") {
    return renderGraphToMatrix(device.kineticPoints.map((point) => point.value), {
      minY: device.kineticLower,
      maxY: Math.max(device.kineticUpper, ...device.kineticPoints.map((point) => point.value), device.kineticUpper),
      title: "КИНЕТИЧ. КРИВАЯ",
      xLabel: "С",
      yLabel: "A",
    });
  }

  if (!rowsOverride && device.screen === "calibrationGraph") {
    const values = device.calibration.plan.filter((step) => step.result).map((step) => step.result.a);
    return renderGraphToMatrix(values, {
      minY: 0,
      maxY: Math.max(1, ...values, 1),
      title: "ТЕКУЩАЯ ГРАДУИР.",
      xLabel: "№",
      yLabel: "A",
    });
  }

  if (!rowsOverride && device.screen === "multiWaveGraph") {
    const values = (device.multiWaveGraphData ?? []).map((point) => point.value);
    return renderGraphToMatrix(values, {
      minY: 0,
      maxY: Math.max(1, ...values, 1),
      title: "MW PROFILE",
      xLabel: "WL",
      yLabel: "A",
    });
  }

  return renderRowsToMatrix(rowsOverride ?? getLcdRows(device));
}

export function measureRows(rows) {
  return rows.map((row, index) => {
    const text = row.text.trimEnd();
    const width = measureBitmapTextWidth(text);
    return {
      row: index + 1,
      text,
      width,
      overflow: width > LCD_TEXT_MAX_WIDTH,
    };
  });
}
