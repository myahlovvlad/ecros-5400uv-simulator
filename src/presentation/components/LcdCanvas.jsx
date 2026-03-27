import React, { useEffect, useMemo, useRef } from "react";
import { LCD_H, LCD_SCALE, LCD_W } from "../../domain/constants/index.js";
import { getLcdRows } from "../../infrastructure/adapters/LcdRenderer.js";

const LCD_FG = "#0f172a";
const LCD_BG = "#edf2ed";
const LCD_GRID_COLOR = "rgba(15, 23, 42, 0.18)";
const LCD_MARGIN = 3;
const GLYPH_H = 8;
const SPACE_W = 5;

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

const FONT_BITMAP = (() => {
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
  add(["Ё"], ["#####", "#....", "#....", "####.", "#....", "#....", "#....", "#####"]);
  add(["Ж"], ["#..#..#", "#..#..#", ".#.#.#.", "..###..", "..###..", ".#.#.#.", "#..#..#", "#..#..#"]);
  add(["З"], [".###.", "#...#", "....#", "..##.", "....#", "....#", "#...#", ".###."]);
  add(["И"], ["#...#", "#...#", "#...#", "#..##", "#.#.#", "##..#", "#...#", "#...#"]);
  add(["Й"], ["#...#", "#...#", "#...#", "#..##", "#.#.#", "##..#", "#...#", "#...#"]);
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

  add(["Λ", "λ"], ["#....", "#....", ".#...", ".#...", "..#..", "..#..", ".#.#.", "#...#"]);
  add(["№"], ["#...##.", "##.#..#", "#.##..#", "#..#..#", "#...##.", ".......", "#######", "......."]);
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

  return map;
})();

function normalizeFontChar(char) {
  if (FONT_BITMAP[char]) return char;
  const upper = char.toUpperCase();
  if (FONT_BITMAP[upper]) return upper;
  return char;
}

function getGlyphBitmap(char) {
  const key = normalizeFontChar(char);
  return FONT_BITMAP[key] || UNKNOWN_GLYPH;
}

function drawBitmapGlyph(ctx, glyph, x, y, inverted = false) {
  ctx.fillStyle = inverted ? LCD_BG : LCD_FG;
  glyph.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (value) ctx.fillRect(x + colIndex, y + rowIndex, 1, 1);
    });
  });
}

function drawBitmapText(ctx, text, x, y, inverted = false) {
  let cursorX = x;
  const maxX = LCD_W - LCD_MARGIN;

  Array.from(text).forEach((char) => {
    const glyph = getGlyphBitmap(char);
    const glyphWidth = glyph[0]?.length ?? 5;
    if (cursorX + glyphWidth > maxX) return;
    drawBitmapGlyph(ctx, glyph, cursorX, y, inverted);
    cursorX += char === " " ? SPACE_W : glyphWidth + 1;
  });
}

function drawBitmapRows(ctx, rows) {
  const trimmedRows = [...rows];
  while (trimmedRows.length && !trimmedRows[trimmedRows.length - 1].text.trim()) trimmedRows.pop();

  const nonEmptyCount = trimmedRows.filter((row) => row.text.trim()).length;
  const rowStep = nonEmptyCount <= 5 ? GLYPH_H + 3 : GLYPH_H + 1;

  ctx.fillStyle = LCD_BG;
  ctx.fillRect(0, 0, LCD_W, LCD_H);

  trimmedRows.forEach((row, rowIndex) => {
    const y = LCD_MARGIN + rowIndex * rowStep;
    if (y + GLYPH_H > LCD_H - LCD_MARGIN) return;
    if (row.inverted) {
      ctx.fillStyle = LCD_FG;
      ctx.fillRect(LCD_MARGIN, y, LCD_W - LCD_MARGIN * 2, GLYPH_H);
    }
    drawBitmapText(ctx, row.text.trimEnd(), LCD_MARGIN, y, row.inverted);
  });

  ctx.strokeStyle = LCD_FG;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, LCD_W - 1, LCD_H - 1);
}

function renderGraph(ctx, values, { minY, maxY, title, xLabel, yLabel }) {
  const x0 = 15;
  const y0 = 11;
  const width = 100;
  const height = 40;

  ctx.clearRect(0, 0, LCD_W, LCD_H);
  ctx.fillStyle = LCD_BG;
  ctx.fillRect(0, 0, LCD_W, LCD_H);
  ctx.strokeStyle = LCD_FG;
  ctx.lineWidth = 1;
  ctx.strokeRect(x0, y0, width, height);

  drawBitmapText(ctx, title.slice(0, 18), LCD_MARGIN, LCD_MARGIN, false);
  drawBitmapText(ctx, yLabel.slice(0, 1), LCD_MARGIN, y0 + 1, false);
  drawBitmapText(ctx, xLabel.slice(0, 2), x0 + width - 10, y0 + height + 2, false);
  drawBitmapText(ctx, String(maxY.toFixed(2)).slice(0, 5), LCD_MARGIN, y0 + 1, false);
  drawBitmapText(ctx, String(minY.toFixed(2)).slice(0, 5), LCD_MARGIN, y0 + height - 6, false);

  if (!values.length) {
    drawBitmapText(ctx, "НЕТ ДАННЫХ", 28, 30, false);
    return;
  }

  const safeMin = Number.isFinite(minY) ? minY : Math.min(...values);
  const safeMax = Number.isFinite(maxY) ? maxY : Math.max(...values) || safeMin + 1;
  const range = Math.max(0.0001, safeMax - safeMin);

  ctx.beginPath();
  values.forEach((value, index) => {
    const x = x0 + (index / Math.max(1, values.length - 1)) * (width - 2) + 1;
    const y = y0 + height - 1 - ((value - safeMin) / range) * (height - 2);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

export function LcdCanvas({ device, scale = LCD_SCALE, rowsOverride = null }) {
  const ref = useRef(null);
  const rows = useMemo(() => rowsOverride ?? getLcdRows(device), [device, rowsOverride]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    if (!rowsOverride && device.screen === "photometryGraph") {
      renderGraph(ctx, device.measurements.map((measurement) => measurement.a), {
        minY: 0,
        maxY: Math.max(1, ...device.measurements.map((measurement) => measurement.a), 1),
        title: "ГРАФИК ФОТОМЕТР.",
        xLabel: "№",
        yLabel: "А",
      });
      return;
    }

    if (!rowsOverride && device.screen === "kineticsGraph") {
      renderGraph(ctx, device.kineticPoints.map((point) => point.value), {
        minY: device.kineticLower,
        maxY: Math.max(device.kineticUpper, ...device.kineticPoints.map((point) => point.value), device.kineticUpper),
        title: "КИНЕТИЧ. КРИВАЯ",
        xLabel: "С",
        yLabel: "А",
      });
      return;
    }

    if (!rowsOverride && device.screen === "calibrationGraph") {
      const values = device.calibration.plan.filter((step) => step.result).map((step) => step.result.a);
      renderGraph(ctx, values, {
        minY: 0,
        maxY: Math.max(1, ...values, 1),
        title: "ТЕКУЩАЯ ГРАДУИР.",
        xLabel: "№",
        yLabel: "А",
      });
      return;
    }

    drawBitmapRows(ctx, rows);
  }, [device, rows]);

  return (
    <div
      className="relative rounded-md border-4 border-zinc-200 bg-[#edf2ed] shadow-inner"
      style={{ width: `${LCD_W * scale}px`, height: `${LCD_H * scale}px` }}
    >
      <canvas
        ref={ref}
        width={LCD_W}
        height={LCD_H}
        style={{
          width: `${LCD_W * scale}px`,
          height: `${LCD_H * scale}px`,
          imageRendering: "pixelated",
          display: "block",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to right, ${LCD_GRID_COLOR} 1px, transparent 1px), linear-gradient(to bottom, ${LCD_GRID_COLOR} 1px, transparent 1px)`,
          backgroundSize: `${scale}px ${scale}px`,
          opacity: 0.95,
        }}
      />
    </div>
  );
}
