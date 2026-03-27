import React, { useEffect, useMemo, useRef, useState } from "react";

const LCD_W = 128;
const LCD_H = 64;
const CHAR_H = 8;
const COLS = 21;
const ROWS = 8;
const LCD_SCALE = 5;
const LCD_FG = "#0f172a";
const LCD_BG = "#edf2ed";
const GLYPH_CELL_W = 6;
const GLYPH_H = 8;

const CLI_COMMANDS = [
  "connect",
  "quit",
  "rezero",
  "getdark",
  "resetdark",
  "ge",
  "swl",
  "getwl",
  "sa",
  "ga",
  "setlampwl",
  "wuon",
  "wuoff",
  "d2on",
  "d2off",
  "gettype",
  "setfilter",
  "setlamp",
  "getlampwl",
  "getd2",
  "getwu",
  "getsoftver",
  "gethardver",
  "swm",
  "adjustwl",
  "ud",
  "cap",
  "help",
  "company",
  "startwl",
  "endwl",
  "getslip",
  "getsampler",
  "setslip",
  "setsampler",
  "btcfg",
  "btcheck",
  "diag",
];

const MENU_MAIN = ["Фотометрия", "Колич. анализ", "Кинетика", "Настройки"];
const MENU_PHOTOMETRY_VALUE = ["A", "%T", "Энергия"];
const MENU_QUANT = ["Новая градуир.", "Коэффициент", "Единицы"];
const MENU_KINETICS = ["Величина", "Верх. граница", "Ниж. граница", "Время", "Пуск"];
const MENU_SETTINGS = ["D2-лампа", "W-лампа", "Темновой ток", "Калибровка λ", "Версия", "Сброс"];
const FILE_GROUPS = ["Фотометрия", "Градуировка", "Коэффициент", "Кинетика"];
const FILE_ACTIONS = ["Открыть", "Переименовать", "Удалить", "Экспорт"];
const UNITS = ["мкг/л", "мг/л", "г/л", "мл/л", "моль/л", "мг/кг", "%", "TCU"];
const DARK_VALUES = [39, 74, 152, 302, 585, 1079, 1880, 3148];
const VALID_FILE_RE = /^[A-Za-zА-Яа-я0-9 _.-]+$/;
const BITMAP_GLYPH_OVERRIDES = {
  "ц": [[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,1,0,0,1,0,0],[0,1,0,0,1,0,0],[0,1,0,0,1,0,0],[0,1,0,0,1,0,0],[0,1,0,0,1,0,0],[0,1,1,1,1,1,0]],
  "Ц": [[0,1,0,0,1,0,0],[0,1,0,0,1,0,0],[0,1,0,0,1,0,0],[0,1,0,0,1,0,0],[0,1,0,0,1,0,0],[0,1,0,0,1,0,0],[0,1,0,0,1,0,0],[0,1,1,1,1,1,0]],
  "ы": [[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,1,0,0,0,0,1],[0,1,0,0,0,0,1],[0,1,1,1,0,0,1],[0,1,0,0,1,0,1],[0,1,0,0,1,0,1],[0,1,1,1,0,0,1]],
  "Ы": [[0,1,0,0,0,0,1],[0,1,0,0,0,0,1],[0,1,0,0,0,0,1],[0,1,1,1,0,0,1],[0,1,0,0,1,0,1],[0,1,0,0,1,0,1],[0,1,0,0,1,0,1],[0,1,1,1,0,0,1]],
  "й": [[0,0,1,1,1,0,0],[0,0,0,0,0,0,0],[0,1,0,0,0,1,0],[0,1,0,0,0,1,0],[0,1,0,0,0,1,0],[0,1,0,0,1,1,0],[0,1,0,1,0,1,0],[0,1,1,0,0,1,0]],
  "Й": [[0,1,0,0,0,0,1],[0,1,0,0,0,0,1],[0,1,0,0,0,0,1],[0,1,0,0,0,0,1],[0,1,0,0,0,1,1],[0,1,0,0,1,0,1],[0,1,0,1,0,0,1],[0,1,1,0,0,0,1]],
  "щ": [[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,1,0,1,0,1,0],[0,1,0,1,0,1,0],[0,1,0,1,0,1,0],[0,1,0,1,0,1,0],[0,1,0,1,0,1,0],[0,1,1,1,1,1,1]],
  "Щ": [[0,1,0,1,0,1,0],[0,1,0,1,0,1,0],[0,1,0,1,0,1,0],[0,1,0,1,0,1,0],[0,1,0,1,0,1,0],[0,1,0,1,0,1,0],[0,1,0,1,0,1,0],[0,1,1,1,1,1,1]],
  "м": [[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,1,0,0,0,1,0],[0,1,1,0,1,1,0],[0,1,0,1,0,1,0],[0,1,0,1,0,1,0],[0,1,0,0,0,1,0],[0,1,0,0,0,1,0]],
  "М": [[0,1,0,0,0,0,0],[0,1,1,0,0,0,1],[0,1,0,1,0,1,0],[0,1,0,0,1,0,0],[0,1,0,0,0,0,0],[0,1,0,0,0,0,0],[0,1,0,0,0,0,0],[0,1,0,0,0,0,0]],
  "ф": [[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,1,1,1,0,0],[0,1,0,1,0,1,0],[0,1,0,1,0,1,0],[0,0,1,1,1,0,0],[0,0,0,1,0,0,0],[0,0,0,1,0,0,0]],
  "Ф": [[0,0,1,1,1,1,1],[0,1,0,0,1,0,0],[0,1,0,0,1,0,0],[0,1,0,0,1,0,0],[0,0,1,1,1,1,1],[0,0,0,0,1,0,0],[0,0,0,0,1,0,0],[0,0,0,0,1,0,0]],
  "д": [[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,1,1,0],[0,0,0,1,0,1,0],[0,0,0,1,0,1,0],[0,0,1,0,0,1,0],[0,0,1,0,0,1,0],[0,1,1,1,1,1,1]],
  "Д": [[0,0,0,0,0,1,1],[0,0,0,0,1,0,1],[0,0,0,1,0,0,1],[0,0,0,1,0,0,1],[0,0,0,1,0,0,1],[0,0,0,1,0,0,1],[0,0,0,1,0,0,1],[0,0,1,1,1,1,1]],
  "№": [[1,0,0,0,1,0,0],[1,1,0,0,1,0,0],[1,0,1,0,1,0,1],[1,0,0,1,1,0,0],[1,0,0,0,1,0,0],[1,0,0,0,1,0,1],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]]
};

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatMmSs(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function pad(text = "", len = COLS) {
  const t = String(text);
  return t.length >= len ? t.slice(0, len) : t + " ".repeat(len - t.length);
}

function center(text = "", len = COLS) {
  const t = String(text);
  if (t.length >= len) return t.slice(0, len);
  const left = Math.floor((len - t.length) / 2);
  return " ".repeat(left) + t + " ".repeat(len - t.length - left);
}

function addNoise(base, amplitude = 12) {
  return Math.round(base + (Math.random() - 0.5) * amplitude * 2);
}

function referenceEnergyAt(wl) {
  const trend = 33880 - Math.abs(wl - 540) * 4.2;
  const ripple = 320 * Math.sin(wl / 46) + 120 * Math.cos(wl / 23);
  return Math.round(clamp(trend + ripple, 12000, 60000));
}

function absorbanceForSample(sample, wl, t = 0) {
  if (sample === "reference") return 0;
  if (sample === "empty") return 3.2;
  if (sample === "sampleA") {
    return (
      0.18 +
      0.22 * Math.exp(-((wl - 505) ** 2) / (2 * 22 ** 2)) +
      0.11 * Math.exp(-((wl - 620) ** 2) / (2 * 35 ** 2))
    );
  }
  if (sample === "holmium") {
    const peaks = [241, 279, 287, 333, 361, 418, 451, 537, 640];
    let a = 0.04;
    for (const p of peaks) {
      a += 0.9 * Math.exp(-((wl - p) ** 2) / (2 * 2.2 ** 2));
    }
    return clamp(a, 0, 3.4);
  }
  if (sample === "kinetic") {
    const baseline = 0.08 + 0.04 * Math.exp(-((wl - 546) ** 2) / (2 * 30 ** 2));
    const rise = 0.75 * (1 - Math.exp(-t / 18));
    return clamp(baseline + rise, 0, 2.5);
  }
  return 0.2;
}

function measureSample(sample, wl, gain, e100, darkValues, timeSec = 0) {
  const dark = darkValues[gain - 1] ?? darkValues[0];
  const ref = referenceEnergyAt(wl);
  const absorbance = absorbanceForSample(sample, wl, timeSec);
  const rawEnergy = clamp(ref * Math.pow(10, -absorbance), dark + 1, 65000);
  const noisy = clamp(addNoise(rawEnergy, 18), dark + 1, 65000);
  const correctedT = clamp((noisy - dark) / Math.max(1, e100 - dark), 0.0001, 2);
  const A = -Math.log10(correctedT);
  return {
    dark,
    energy: noisy,
    t: clamp(correctedT * 100, 0, 200),
    a: clamp(A, -0.3, 3.999),
  };
}

function fileExtByGroup(group) {
  switch (group) {
    case "Фотометрия":
      return ".qua";
    case "Градуировка":
      return ".std";
    case "Коэффициент":
      return ".cof";
    case "Кинетика":
      return ".kin";
    default:
      return ".bak";
  }
}

function seedFiles() {
  return {
    Фотометрия: [
      { name: "Blank_540", ext: ".qua", exported: false },
      { name: "Holmium_test", ext: ".qua", exported: true },
    ],
    Градуировка: [{ name: "Fe_series_v1", ext: ".std", exported: false }],
    Коэффициент: [{ name: "Protein_KB", ext: ".cof", exported: false }],
    Кинетика: [{ name: "Reaction_A", ext: ".kin", exported: false }],
  };
}

function buildCalibrationPlan(standards, parallels) {
  const plan = [];
  let op = 1;
  for (let p = 1; p <= parallels; p += 1) {
    for (let s = 1; s <= standards; s += 1) {
      plan.push({
        id: `${s}-${p}`,
        code: `C-${s}-${p}`,
        standardIndex: s,
        parallelIndex: p,
        opInsert: op++,
        opMeasure: op++,
        status: "pending",
        result: null,
      });
    }
  }
  return plan;
}

function getCalibrationDoneCount(plan) {
  return plan.filter((step) => Boolean(step.result)).length;
}

function getCalibrationResultIndexes(plan) {
  return plan
    .map((step, idx) => ({ step, idx }))
    .filter(({ step }) => Boolean(step.result))
    .map(({ idx }) => idx);
}

function findNextPendingStep(plan, fromIndex = -1) {
  for (let i = fromIndex + 1; i < plan.length; i += 1) {
    if (!plan[i].result) return i;
  }
  return -1;
}

function findPrevMeasuredIndex(plan, fromIndex) {
  for (let i = fromIndex - 1; i >= 0; i -= 1) {
    if (plan[i]?.result) return i;
  }
  return fromIndex;
}

function findNextMeasuredIndex(plan, fromIndex) {
  for (let i = fromIndex + 1; i < plan.length; i += 1) {
    if (plan[i]?.result) return i;
  }
  return -1;
}

function buildUsbExportPreview({ group, name, ext, measurements, calibrationPlan, kineticPoints, wavelength, quantK, quantB, lastA }) {
  const lines = [
    `USB_DEVICE=USB1`,
    `GROUP=${group}`,
    `FILE=${name}${ext}`,
    `EXPORT_FORMAT=csv`,
    `---`,
  ];

  if (group === "Фотометрия") {
    lines.push("index,wavelength_nm,energy,A,T_percent");
    const rows = measurements.slice(-10);
    if (!rows.length) {
      lines.push(`1,${wavelength.toFixed(1)},,,`);
    } else {
      rows.forEach((m) => lines.push(`${m.index},${m.wavelength.toFixed(1)},${m.energy},${m.a.toFixed(4)},${m.t.toFixed(2)}`));
    }
    return lines.join("\n");
  }

  if (group === "Градуировка") {
    lines.push("code,standard_index,parallel_index,A,T_percent,energy");
    const rows = calibrationPlan.filter((step) => step.result);
    if (!rows.length) {
      lines.push("C-1-1,1,1,,,");
    } else {
      rows.forEach((step) => lines.push(`${step.code},${step.standardIndex},${step.parallelIndex},${step.result.a.toFixed(4)},${step.result.t.toFixed(2)},${step.result.energy}`));
    }
    return lines.join("\n");
  }

  if (group === "Коэффициент") {
    lines.push("wavelength_nm,K,B,A,result");
    const result = quantK * lastA + quantB;
    lines.push(`${wavelength.toFixed(1)},${quantK.toFixed(6)},${quantB.toFixed(6)},${lastA.toFixed(6)},${result.toFixed(6)}`);
    return lines.join("\n");
  }

  lines.push("time_s,A");
  if (!kineticPoints.length) {
    lines.push("0,");
  } else {
    kineticPoints.slice(-20).forEach((point) => lines.push(`${point.time},${point.value.toFixed(6)}`));
  }
  return lines.join("\n");
}

function rasterizeGlyph(char) {
  const canvas = document.createElement("canvas");
  canvas.width = 7;
  canvas.height = 8;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { width: 0, rows: Array.from({ length: GLYPH_H }, () => []) };
  }
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, 7, 8);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 8px monospace";
  ctx.textBaseline = "top";
  const x = char === "." || char === "," || char === ":" || char === ";" ? 1 : 0;
  ctx.fillText(char, x, -0.5);
  const image = ctx.getImageData(0, 0, 7, 8).data;
  const rows = [];
  let minX = 7;
  let maxX = -1;
  for (let y = 0; y < 8; y += 1) {
    const row = [];
    for (let xPos = 0; xPos < 7; xPos += 1) {
      const idx = (y * 7 + xPos) * 4;
      const on = image[idx] > 120;
      row.push(on ? 1 : 0);
      if (on) {
        minX = Math.min(minX, xPos);
        maxX = Math.max(maxX, xPos);
      }
    }
    rows.push(row);
  }
  if (maxX < minX) {
    return { width: char === " " ? 3 : 4, rows: Array.from({ length: GLYPH_H }, () => [0, 0, 0]) };
  }
  const width = Math.max(1, maxX - minX + 1);
  return {
    width,
    rows: rows.map((row) => row.slice(minX, maxX + 1)),
  };
}

function getGlyphBitmap(char, cache) {
  if (cache[char]) return cache[char];
  const override = BITMAP_GLYPH_OVERRIDES[char];
  if (override) {
    const first = override.findIndex((row) => row.some(Boolean));
    const last = [...override].reverse().findIndex((row) => row.some(Boolean));
    const trimmedRows = first === -1 ? override : override.slice(first, override.length - last);
    let minX = 7;
    let maxX = -1;
    trimmedRows.forEach((row) => {
      row.forEach((value, idx) => {
        if (value) {
          minX = Math.min(minX, idx);
          maxX = Math.max(maxX, idx);
        }
      });
    });
    const clipped = maxX < minX ? trimmedRows : trimmedRows.map((row) => row.slice(minX, maxX + 1));
    cache[char] = { width: clipped[0]?.length || 3, rows: clipped };
    return cache[char];
  }
  cache[char] = rasterizeGlyph(char);
  return cache[char];
}

function drawBitmapGlyph(ctx, glyph, x, y, inverted = false) {
  const color = inverted ? LCD_BG : LCD_FG;
  ctx.fillStyle = color;
  glyph.rows.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (value) ctx.fillRect(x + colIndex, y + rowIndex, 1, 1);
    });
  });
}

function drawBitmapRows(ctx, rows, glyphCache) {
  ctx.fillStyle = LCD_BG;
  ctx.fillRect(0, 0, LCD_W, LCD_H);
  rows.forEach((row, rowIndex) => {
    const y = rowIndex * CHAR_H;
    if (row.inverted) {
      ctx.fillStyle = LCD_FG;
      ctx.fillRect(0, y, LCD_W, CHAR_H);
    }
    let x = 1;
    const chars = Array.from(row.text);
    chars.forEach((char) => {
      const glyph = getGlyphBitmap(char, glyphCache);
      drawBitmapGlyph(ctx, glyph, x, y, row.inverted);
      x += Math.min(GLYPH_CELL_W, glyph.width + 1);
    });
  });
  ctx.strokeStyle = LCD_FG;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, LCD_W - 1, LCD_H - 1);
}

function assertDev(condition, message) {
  if (!condition) {
    throw new Error(`Self-test failed: ${message}`);
  }
}

function runSelfTests() {
  const plan = buildCalibrationPlan(3, 2);
  assertDev(plan.length === 6, "plan length should equal standards * parallels");
  assertDev(plan[0].code === "C-1-1", "first plan code should be C-1-1");
  assertDev(plan[5].code === "C-3-2", "last plan code should be C-3-2");
  assertDev(fileExtByGroup("Фотометрия") === ".qua", "photometry extension mismatch");
  assertDev(fileExtByGroup("Градуировка") === ".std", "calibration extension mismatch");
  assertDev(clamp(15, 1, 9) === 9, "clamp upper bound mismatch");
  assertDev(clamp(-1, 1, 9) === 1, "clamp lower bound mismatch");
  const preview = buildUsbExportPreview({
    group: "Коэффициент",
    name: "Protein_KB",
    ext: ".cof",
    measurements: [],
    calibrationPlan: [],
    kineticPoints: [],
    wavelength: 546.2,
    quantK: 2,
    quantB: 1,
    lastA: 0.5,
  });
  assertDev(preview.includes("EXPORT_FORMAT=csv"), "usb preview must include export format");
  assertDev(preview.includes("wavelength_nm,K,B,A,result"), "coefficient preview header mismatch");
}

const sampleOptions = [
  { value: "reference", label: "Эталон / blank" },
  { value: "sampleA", label: "Образец A" },
  { value: "holmium", label: "Холмиевое стекло" },
  { value: "kinetic", label: "Кинетический образец" },
  { value: "empty", label: "Пустая позиция" },
];

function initialDevice() {
  return {
    screen: "boot",
    previousScreen: "main",
    mainIndex: 0,
    photometryValueIndex: 0,
    quantIndex: 1,
    kineticsIndex: 0,
    settingsIndex: 0,
    unitsIndex: 4,
    wavelength: 546.2,
    gain: 1,
    slip: 2,
    sampler: 0,
    lampWL: 340.5,
    d2Lamp: true,
    wLamp: true,
    softwareVersion: "2.8.46",
    hardwareVersion: "R0D",
    company: "METASH Instrument",
    inputBuffer: "",
    inputTarget: null,
    returnScreen: "photometry",
    measurements: [],
    measurementCursor: 0,
    kineticPoints: [],
    kineticDuration: 60,
    kineticUpper: 1.5,
    kineticLower: 0,
    quantK: 1,
    quantB: 0,
    e100: 33869,
    lastEnergy: 33869,
    lastComputedA: 0,
    lastComputedT: 100,
    darkValues: [...DARK_VALUES],
    busy: false,
    busyLabel: "Подождите...",
    diagIndex: 0,
    warmupRemaining: 15 * 60,
    currentSample: "reference",
    logLines: [
      "2026-03-24T16:20:17.662 - connect",
      "2026-03-24T16:20:26.365 - ok.",
    ],
    fileRootIndex: 0,
    fileListIndex: 0,
    fileActionIndex: 0,
    fileContext: { mode: "browse", group: "Фотометрия" },
    files: seedFiles(),
    saveMeta: { group: "Фотометрия", suggestedExt: ".qua" },
    usbExports: [],
    usbPreviewIndex: 0,
    warning: null,
    warningReturn: "main",
    dialogTitle: "",
    calibration: {
      standards: 3,
      parallels: 3,
      plan: buildCalibrationPlan(3, 3),
      stepIndex: 0,
      resultCursor: 0,
    },
  };
}

function renderGraph(ctx, values, { minY, maxY, title, xLabel, yLabel }) {
  const x0 = 10;
  const y0 = 8;
  const w = 112;
  const h = 48;

  ctx.clearRect(0, 0, LCD_W, LCD_H);
  ctx.fillStyle = LCD_BG;
  ctx.fillRect(0, 0, LCD_W, LCD_H);
  ctx.strokeStyle = LCD_FG;
  ctx.lineWidth = 1;
  ctx.strokeRect(x0, y0, w, h);
  const graphGlyphCache = {};
  drawBitmapRows(ctx, [{ text: pad(title.slice(0, 18)), inverted: false }], graphGlyphCache);
  drawBitmapGlyph(ctx, getGlyphBitmap(yLabel[0] || "A", graphGlyphCache), 1, y0 + 2, false);
  Array.from(xLabel.slice(0, 2)).forEach((char, idx) => drawBitmapGlyph(ctx, getGlyphBitmap(char, graphGlyphCache), x0 + w - 18 + idx * 6, y0 + h + 6, false));
  Array.from(String(maxY.toFixed(2)).slice(0, 5)).forEach((char, idx) => drawBitmapGlyph(ctx, getGlyphBitmap(char, graphGlyphCache), idx * 6, y0 + 1, false));
  Array.from(String(minY.toFixed(2)).slice(0, 5)).forEach((char, idx) => drawBitmapGlyph(ctx, getGlyphBitmap(char, graphGlyphCache), idx * 6, y0 + h - 1, false));

  if (!values.length) {
    Array.from("Нет данных").forEach((char, idx) => drawBitmapGlyph(ctx, getGlyphBitmap(char, graphGlyphCache), 40 + idx * 6, 35, false));
    return;
  }

  const safeMin = Number.isFinite(minY) ? minY : Math.min(...values);
  const safeMax = Number.isFinite(maxY) ? maxY : Math.max(...values) || safeMin + 1;
  const range = Math.max(0.0001, safeMax - safeMin);

  ctx.beginPath();
  values.forEach((v, i) => {
    const x = x0 + (i / Math.max(1, values.length - 1)) * (w - 2) + 1;
    const y = y0 + h - 1 - ((v - safeMin) / range) * (h - 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function lcdRows(device) {
  const rows = [];
  const push = (text, inverted = false) => rows.push({ text: pad(text), inverted });

  if (device.busy) {
    push("");
    push("");
    push(center(device.busyLabel));
    push("");
    push(center("Идёт операция"));
    push("");
    push("");
    push("");
    return rows;
  }

  if (device.screen === "boot") {
    push("");
    push(center("ЭКРОС-5400УФ"));
    push("");
    push(center("Добро пожаловать"));
    push("");
    push("");
    push("");
    push("");
    return rows;
  }

  if (device.screen === "diagnostic") {
    const items = ["Фильтры", "Лампы", "Детектор", "D2-лампа", "W-лампа", "Калибр. λ", "Темн. ток"];
    push("Диагностика", true);
    items.forEach((item, i) => {
      const status = i < device.diagIndex ? "[OK]" : i === device.diagIndex ? "[...]" : "[ ]";
      push(`${item} ${status}`);
    });
    while (rows.length < ROWS) push("");
    return rows.slice(0, ROWS);
  }

  if (device.screen === "warmup") {
    push("Прогрев", true);
    push("ESC - пропуск");
    push("");
    push("");
    push(center(formatMmSs(device.warmupRemaining)));
    push("");
    push("");
    push("");
    return rows;
  }

  if (device.screen === "warning") {
    push(center("ПРЕДУПРЕЖДЕНИЕ"), true);
    push("");
    push(center(device.warning?.title || "Внимание"));
    const parts = String(device.warning?.body || "").match(/.{1,20}/g) || [""];
    push(center(parts[0] || ""));
    push(center(parts[1] || ""));
    push("");
    push(center("ENTER / ESC"));
    push("");
    return rows;
  }

  if (device.screen === "input") {
    push(device.dialogTitle || "Введите значение", true);
    push("");
    push(center(device.inputBuffer || "_"));
    push("");
    push("0-9 . - CLEAR");
    push("ENTER - принять");
    push("ESC - отмена");
    push("");
    return rows;
  }

  if (device.screen === "saveDialog") {
    push("Сохранить файл", true);
    push(`Тип ${device.saveMeta.group}`);
    push(`${device.inputBuffer || "_"}${device.saveMeta.suggestedExt}`);
    push("");
    push("Имя вручную");
    push("ENTER - сохранить");
    push("ESC - отмена");
    push("");
    return rows;
  }

  if (device.screen === "main") {
    push("Главное меню", true);
    MENU_MAIN.forEach((item, idx) => push(item, device.mainIndex === idx));
    push("");
    push(`λ ${device.wavelength.toFixed(1)} нм`);
    push(`Образец ${sampleOptions.find((s) => s.value === device.currentSample)?.label ?? "-"}`);
    return rows.slice(0, ROWS);
  }

  if (device.screen === "fileRoot") {
    push("Файловый менеджер", true);
    FILE_GROUPS.forEach((item, idx) => push(item, device.fileRootIndex === idx));
    push("");
    push("ENTER - открыть");
    push("ESC - назад");
    while (rows.length < ROWS) push("");
    return rows;
  }

  if (device.screen === "fileList") {
    const group = device.fileContext.group;
    const files = device.files[group] || [];
    push(`Файлы: ${group}`, true);
    if (!files.length) {
      push("<пусто>", true);
      while (rows.length < ROWS) push("");
      return rows.slice(0, ROWS);
    }
    const start = Math.floor(device.fileListIndex / 6) * 6;
    files.slice(start, start + 6).forEach((file, i) => {
      const idx = start + i;
      push(`${file.name}${file.ext}`.slice(0, COLS), device.fileListIndex === idx);
    });
    while (rows.length < 6) push("");
    push("ENTER - действия");
    push("ESC - назад");
    return rows.slice(0, ROWS);
  }

  if (device.screen === "fileActionMenu") {
    const selected = (device.files[device.fileContext.group] || [])[device.fileListIndex];
    push(center(selected ? `${selected.name}${selected.ext}` : "Файл"), true);
    FILE_ACTIONS.forEach((action, idx) => push(action, device.fileActionIndex === idx));
    push("");
    push("ENTER - выбрать");
    push("ESC - отмена");
    while (rows.length < ROWS) push("");
    return rows;
  }

  if (device.screen === "photometryValue") {
    push("Фотометрия: величина", true);
    MENU_PHOTOMETRY_VALUE.forEach((item, idx) => push(item, device.photometryValueIndex === idx));
    push("");
    push("ENTER - выбрать");
    push("ESC - назад");
    while (rows.length < ROWS) push("");
    return rows;
  }

  if (device.screen === "quantUnits") {
    push("Единицы", true);
    const start = Math.floor(device.unitsIndex / 6) * 6;
    UNITS.slice(start, start + 6).forEach((item, i) => {
      const idx = start + i;
      push(item, device.unitsIndex === idx);
    });
    while (rows.length < ROWS) push("");
    return rows.slice(0, ROWS);
  }

  if (device.screen === "quantMain") {
    push("Колич. анализ", true);
    MENU_QUANT.forEach((item, idx) => push(item, device.quantIndex === idx));
    push("");
    push(`K=${device.quantK.toFixed(3)}`);
    push(`B=${device.quantB.toFixed(3)} ${UNITS[device.unitsIndex]}`);
    push("ENTER - открыть");
    return rows.slice(0, ROWS);
  }

  if (device.screen === "quantCoef") {
    const conc = device.quantK * device.lastComputedA + device.quantB;
    push("Коэффициент", true);
    push(`${device.wavelength.toFixed(1)} нм`);
    push(`${device.lastComputedA.toFixed(3)} Abs`);
    push(`${conc.toFixed(3)} ${UNITS[device.unitsIndex]}`);
    push("");
    push(`K=${device.quantK.toFixed(3)}`);
    push(`B=${device.quantB.toFixed(3)}`);
    push("START/FILE/ESC");
    return rows;
  }

  if (device.screen === "calibrationSetupStandards") {
    push("Новая градуировка", true);
    push("Число стандартов");
    push(center(String(device.calibration.standards)), true);
    push("");
    push("UP/DOWN: 1..9");
    push("ENTER - далее");
    push("ESC - назад");
    push("");
    return rows;
  }

  if (device.screen === "calibrationSetupParallels") {
    push("Новая градуировка", true);
    push("Число параллелей");
    push(center(String(device.calibration.parallels)), true);
    push("");
    push("UP/DOWN: 1..9");
    push("ENTER - план");
    push("ESC - назад");
    push("");
    return rows;
  }

  if (device.screen === "calibrationPlan") {
    const step = device.calibration.plan[device.calibration.stepIndex];
    push("План измерений", true);
    push(`Стандартов ${device.calibration.standards}`);
    push(`Параллелей ${device.calibration.parallels}`);
    push(`След. шаг ${step?.code || "-"}`);
    push(`Готово ${getCalibrationDoneCount(device.calibration.plan)}/${device.calibration.plan.length}`);
    push("ENTER - начать");
    push("НОЛЬ доступен");
    push("DOWN - журнал");
    return rows;
  }

  if (device.screen === "calibrationStep") {
    const step = device.calibration.plan[device.calibration.stepIndex];
    push("Новая градуировка", true);
    push(`Вставьте ${step?.code || "C-1-1"}`);
    push(`Серия ${step?.parallelIndex || 1}`);
    push(`Стандарт ${step?.standardIndex || 1}`);
    push("");
    push("НОЛЬ - обнулить");
    push("START - измерить");
    push("ESC - план");
    return rows;
  }

  if (device.screen === "calibrationJournal") {
    const resultIndexes = getCalibrationResultIndexes(device.calibration.plan);
    const cursor = resultIndexes.includes(device.calibration.resultCursor)
      ? device.calibration.resultCursor
      : resultIndexes[resultIndexes.length - 1] ?? 0;
    const cursorPos = Math.max(0, resultIndexes.indexOf(cursor));
    const start = Math.max(0, cursorPos - 2);
    const visibleIndexes = resultIndexes.slice(start, start + 4);

    push(`Журнал ${getCalibrationDoneCount(device.calibration.plan)}/${device.calibration.plan.length}`, true);
    if (!visibleIndexes.length) {
      push("Нет результатов", true);
      push("");
      push("");
      push("");
    } else {
      visibleIndexes.forEach((idx) => {
        const step = device.calibration.plan[idx];
        push(`${step.code} A=${step.result.a.toFixed(3)}`, idx === cursor);
      });
      while (rows.length < 5) push("");
    }
    push("ENTER - далее");
    push("START - перемерить");
    push("CLEAR - удалить");
    return rows.slice(0, ROWS);
  }

  if (device.screen === "calibrationGraph") {
    push("График градуировки", true);
    push(`Готово ${getCalibrationDoneCount(device.calibration.plan)}/${device.calibration.plan.length}`);
    push("ESC - журнал");
    push("FILE - сохранить");
    while (rows.length < ROWS) push("");
    return rows;
  }

  if (device.screen === "kineticsMenu") {
    push("Кинетика", true);
    MENU_KINETICS.forEach((item, idx) => push(item, device.kineticsIndex === idx));
    push(`t=${device.kineticDuration}s`);
    push(`A ${device.kineticLower.toFixed(2)}..${device.kineticUpper.toFixed(2)}`);
    return rows.slice(0, ROWS);
  }

  if (device.screen === "kineticsRun") {
    push("Кинетика", true);
    push(`t=${device.kineticPoints.at(-1)?.time ?? 0}s`);
    push(`A=${device.lastComputedA.toFixed(3)}`);
    push(`%T=${device.lastComputedT.toFixed(1)}`);
    push("");
    push("DOWN - график");
    push("START - стоп");
    push("ESC - меню");
    return rows;
  }

  if (device.screen === "settings") {
    push("Настройки", true);
    MENU_SETTINGS.forEach((item, idx) => {
      const label =
        idx === 0 ? `${item} ${device.d2Lamp ? "Вкл" : "Выкл"}` :
        idx === 1 ? `${item} ${device.wLamp ? "Вкл" : "Выкл"}` :
        item;
      push(label, device.settingsIndex === idx);
    });
    push(`Щель=${device.slip} Сампл=${device.sampler}`);
    return rows.slice(0, ROWS);
  }

  if (device.screen === "version") {
    push("О системе", true);
    push("ЭКРОС-5400УФ");
    push(`SW ${device.softwareVersion}`);
    push(`HW ${device.hardwareVersion}`);
    push(device.company);
    push("");
    push("ENTER/ESC - назад");
    push("");
    return rows;
  }

  const valueLabel = MENU_PHOTOMETRY_VALUE[device.photometryValueIndex];
  const currentRows = device.measurements.slice(-3);
  push(`Фотометрия ${valueLabel}`, true);
  push(center(`${device.wavelength.toFixed(1)} нм`));
  push(
    center(
      valueLabel === "A"
        ? `${device.lastComputedA.toFixed(3)} A`
        : valueLabel === "%T"
          ? `${device.lastComputedT.toFixed(1)} %T`
          : `${device.lastEnergy}`,
    ),
  );
  push("---------------------");
  currentRows.forEach((m, localIdx) => {
    const globalIndex = Math.max(0, device.measurements.length - currentRows.length) + localIdx;
    const line =
      valueLabel === "A"
        ? `${m.index} ${m.wavelength.toFixed(1)} ${m.a.toFixed(3)}`
        : valueLabel === "%T"
          ? `${m.index} ${m.wavelength.toFixed(1)} ${m.t.toFixed(1)}`
          : `${m.index} ${m.wavelength.toFixed(1)} ${m.energy}`;
    push(line, device.measurements.length > 0 && device.measurementCursor === globalIndex);
  });
  if (!device.measurements.length) push("Нет результатов");
  push(device.measurements.length ? "DOWN после списка -> гр" : "START - измерить");
  while (rows.length < ROWS) push("");
  return rows.slice(0, ROWS);
}

function LcdCanvas({ device }) {
  const ref = useRef(null);
  const glyphCacheRef = useRef({});
  const rows = useMemo(() => lcdRows(device), [device]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    if (device.screen === "photometryGraph") {
      renderGraph(ctx, device.measurements.map((m) => m.a), {
        minY: 0,
        maxY: Math.max(1, ...device.measurements.map((m) => m.a), 1),
        title: "График фотометрии",
        xLabel: "N",
        yLabel: "A",
      });
      return;
    }

    if (device.screen === "kineticsGraph") {
      renderGraph(ctx, device.kineticPoints.map((p) => p.value), {
        minY: device.kineticLower,
        maxY: Math.max(device.kineticUpper, ...device.kineticPoints.map((p) => p.value), device.kineticUpper),
        title: "Кинетическая кривая",
        xLabel: "t",
        yLabel: "A",
      });
      return;
    }

    if (device.screen === "calibrationGraph") {
      const values = device.calibration.plan.filter((p) => p.result).map((p) => p.result.a);
      renderGraph(ctx, values, {
        minY: 0,
        maxY: Math.max(1, ...values, 1),
        title: "Текущая градуир.",
        xLabel: "std",
        yLabel: "A",
      });
      return;
    }

    drawBitmapRows(ctx, rows, glyphCacheRef.current);
  }, [rows, device]);

  return (
    <canvas
      ref={ref}
      width={LCD_W}
      height={LCD_H}
      className="rounded-md border-4 border-zinc-200 bg-[#edf2ed] shadow-inner"
      style={{
        width: `${LCD_W * LCD_SCALE}px`,
        height: `${LCD_H * LCD_SCALE}px`,
        imageRendering: "pixelated",
      }}
    />
  );
}

function ButtonKey({ label, sublabel, onClick, className = "", tall = false }) {
  return (
    <button
      onClick={onClick}
      className={`select-none rounded-2xl border border-zinc-300 bg-zinc-100 px-3 py-2 text-center font-semibold text-emerald-700 shadow-sm transition hover:translate-y-[1px] hover:bg-white ${tall ? "min-h-[64px]" : "min-h-[52px]"} ${className}`}
    >
      <div className="text-sm leading-tight">{label}</div>
      {sublabel ? <div className="text-[10px] leading-tight opacity-80">{sublabel}</div> : null}
    </button>
  );
}

export default function Ecros5400UvSimulator() {
  const [device, setDevice] = useState(initialDevice);
  const [cliValue, setCliValue] = useState("help");
  const kineticTimer = useRef(null);
  const selfTestsRan = useRef(false);

  useEffect(() => {
    if (!selfTestsRan.current) {
      runSelfTests();
      selfTestsRan.current = true;
    }
  }, []);

  const logLine = (line) => {
    setDevice((d) => ({ ...d, logLines: [...d.logLines.slice(-180), line] }));
  };

  const setBusy = async (label, ms) => {
    setDevice((d) => ({ ...d, busy: true, busyLabel: label }));
    await sleep(ms);
    setDevice((d) => ({ ...d, busy: false, busyLabel: "Подождите..." }));
  };

  const showWarning = (title, body, warningReturn = "main") => {
    setDevice((d) => ({ ...d, screen: "warning", warning: { title, body }, warningReturn }));
  };

  const buildCurrentUsbRecord = (group, name, ext) => {
    const content = buildUsbExportPreview({
      group,
      name,
      ext,
      measurements: device.measurements,
      calibrationPlan: device.calibration.plan,
      kineticPoints: device.kineticPoints,
      wavelength: device.wavelength,
      quantK: device.quantK,
      quantB: device.quantB,
      lastA: device.lastComputedA,
    });
    return {
      id: `${Date.now()}-${name}`,
      target: "USB1",
      group,
      name,
      ext,
      content,
      exportedAt: new Date().toLocaleString(),
    };
  };

  const renameCurrentFile = () => {
    const group = device.fileContext.group;
    const items = [...device.files[group]];
    const selected = items[device.fileListIndex];
    const name = (device.inputBuffer || "").trim();

    if (!name) return showWarning("Пустое имя", "Введите имя файла", "fileActionMenu");
    if (name.length > 18) return showWarning("Имя длинное", "Максимум 18 символов", "fileActionMenu");
    if (!VALID_FILE_RE.test(name)) return showWarning("Недопустимые симв.", "Исправьте имя файла", "fileActionMenu");
    if (items.some((f, idx) => idx !== device.fileListIndex && f.name === name)) {
      return showWarning("Имя уже есть", "Выберите другое имя", "fileActionMenu");
    }

    items[device.fileListIndex] = { ...selected, name };
    setDevice((d) => ({
      ...d,
      files: { ...d.files, [group]: items },
      screen: "fileList",
      inputBuffer: "",
      inputTarget: null,
    }));
  };

  const saveCurrentResults = () => {
    const name = (device.inputBuffer || "").trim();
    const group = device.saveMeta.group;
    const ext = device.saveMeta.suggestedExt;
    const items = [...device.files[group]];

    if (!name) return showWarning("Пустое имя", "Введите имя файла", "saveDialog");
    if (name.length > 18) return showWarning("Имя длинное", "Максимум 18 символов", "saveDialog");
    if (!VALID_FILE_RE.test(name)) return showWarning("Недопустимые симв.", "Исправьте имя файла", "saveDialog");
    if (items.some((f) => f.name === name)) return showWarning("Имя уже есть", "Нужно другое имя", "saveDialog");

    items.push({ name, ext, exported: false });
    setDevice((d) => ({
      ...d,
      files: { ...d.files, [group]: items },
      inputBuffer: "",
      inputTarget: null,
      screen: d.previousScreen || "main",
    }));
    logLine(`save -> ${name}${ext}`);
  };

  useEffect(() => {
    const bootTimer = setTimeout(() => setDevice((d) => ({ ...d, screen: "diagnostic" })), 600);
    return () => clearTimeout(bootTimer);
  }, []);

  useEffect(() => {
    if (device.screen !== "diagnostic") return undefined;
    if (device.diagIndex >= 7) {
      const t = setTimeout(() => setDevice((d) => ({ ...d, screen: "warmup" })), 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setDevice((d) => ({ ...d, diagIndex: d.diagIndex + 1 })), 350);
    return () => clearTimeout(t);
  }, [device.screen, device.diagIndex]);

  useEffect(() => {
    if (device.screen !== "warmup") return undefined;
    const t = setTimeout(() => {
      setDevice((d) => {
        if (d.warmupRemaining <= 1) return { ...d, screen: "main", warmupRemaining: 0 };
        return { ...d, warmupRemaining: d.warmupRemaining - 1 };
      });
    }, 80);
    return () => clearTimeout(t);
  }, [device.screen, device.warmupRemaining]);

  useEffect(() => () => {
    if (kineticTimer.current) clearInterval(kineticTimer.current);
  }, []);

  const performRezero = async () => {
    await setBusy("Калибровка ZERO", 700);
    const e100 = addNoise(referenceEnergyAt(device.wavelength), 10);
    setDevice((d) => ({
      ...d,
      e100,
      gain: 1,
      lastEnergy: e100,
      lastComputedA: 0,
      lastComputedT: 100,
    }));
    logLine(`rezero -> ${e100}`);
    logLine("gain -> 1");
  };

  const performDarkCurrent = async () => {
    await setBusy("Темновой ток", 900);
    const vals = DARK_VALUES.map((v, i) => addNoise(v + i * 2, 4));
    setDevice((d) => ({ ...d, darkValues: vals }));
    logLine(`resetdark -> ${vals.join(", ")}`);
  };

  const performWavelengthCalibration = async () => {
    await setBusy("Калибровка λ", 1600);
    logLine("adjustwl -> ok");
    showWarning("Успешно", "WL OK!", "settings");
  };

  const performPhotometryMeasure = () => {
    const m = measureSample(device.currentSample, device.wavelength, device.gain, device.e100, device.darkValues);
    setDevice((d) => {
      const next = [...d.measurements, { index: d.measurements.length + 1, wavelength: d.wavelength, ...m }].slice(-100);
      return {
        ...d,
        lastEnergy: m.energy,
        lastComputedA: m.a,
        lastComputedT: m.t,
        measurements: next,
        measurementCursor: next.length ? next.length - 1 : 0,
      };
    });
    logLine(`ge 1 -> ${m.energy}`);
  };

  const performCalibrationMeasure = () => {
    const m = measureSample(device.currentSample, device.wavelength, device.gain, device.e100, device.darkValues);
    setDevice((d) => {
      const plan = [...d.calibration.plan];
      const step = plan[d.calibration.stepIndex];
      plan[d.calibration.stepIndex] = { ...step, result: m, status: "done" };
      return {
        ...d,
        lastEnergy: m.energy,
        lastComputedA: m.a,
        lastComputedT: m.t,
        calibration: {
          ...d.calibration,
          plan,
          resultCursor: d.calibration.stepIndex,
        },
        screen: "calibrationJournal",
      };
    });
    logLine(`calibration -> ${device.calibration.plan[device.calibration.stepIndex]?.code}`);
  };

  const moveCalibrationCursor = (direction) => {
    setDevice((d) => {
      const { plan, resultCursor } = d.calibration;
      const measured = getCalibrationResultIndexes(plan);
      if (!measured.length) return d;
      const current = measured.includes(resultCursor) ? resultCursor : measured[measured.length - 1];
      if (direction === "up") {
        const prev = findPrevMeasuredIndex(plan, current);
        return { ...d, calibration: { ...d.calibration, resultCursor: prev } };
      }
      const next = findNextMeasuredIndex(plan, current);
      if (next === -1) {
        return { ...d, calibration: { ...d.calibration, resultCursor: current }, screen: "calibrationGraph" };
      }
      return { ...d, calibration: { ...d.calibration, resultCursor: next } };
    });
  };

  const nextCalibrationStep = () => {
    setDevice((d) => {
      const nextIndex = findNextPendingStep(d.calibration.plan, d.calibration.stepIndex);
      if (nextIndex === -1) {
        return { ...d, screen: "calibrationGraph" };
      }
      return {
        ...d,
        calibration: {
          ...d.calibration,
          stepIndex: nextIndex,
        },
        screen: "calibrationStep",
      };
    });
  };

  const remeasureCalibrationAtCursor = () => {
    setDevice((d) => ({
      ...d,
      calibration: {
        ...d.calibration,
        stepIndex: d.calibration.resultCursor,
      },
      screen: "calibrationStep",
    }));
  };

  const deleteCalibrationAtCursor = () => {
    setDevice((d) => {
      const idx = d.calibration.resultCursor;
      const plan = [...d.calibration.plan];
      const step = plan[idx];
      if (!step?.result) return d;
      plan[idx] = { ...step, result: null, status: "pending" };
      return {
        ...d,
        calibration: {
          ...d.calibration,
          plan,
          stepIndex: idx,
          resultCursor: idx,
        },
        screen: "calibrationStep",
      };
    });
  };

  const startKinetics = () => {
    if (kineticTimer.current) clearInterval(kineticTimer.current);
    setDevice((d) => ({ ...d, kineticPoints: [], screen: "kineticsRun" }));
    const started = Date.now();
    kineticTimer.current = setInterval(() => {
      setDevice((d) => {
        const time = Math.floor((Date.now() - started) / 500);
        const m = measureSample("kinetic", d.wavelength, d.gain, d.e100, d.darkValues, time);
        const nextPoints = [...d.kineticPoints, { time, value: m.a }];
        if (time >= d.kineticDuration) {
          clearInterval(kineticTimer.current);
          kineticTimer.current = null;
        }
        return {
          ...d,
          kineticPoints: nextPoints,
          lastEnergy: m.energy,
          lastComputedA: m.a,
          lastComputedT: m.t,
        };
      });
    }, 500);
  };

  const stopKinetics = () => {
    if (kineticTimer.current) clearInterval(kineticTimer.current);
    kineticTimer.current = null;
    setDevice((d) => ({ ...d, screen: "kineticsMenu" }));
  };

  const openSaveDialog = (group, previousScreen) => {
    setDevice((d) => ({
      ...d,
      screen: "saveDialog",
      previousScreen,
      saveMeta: { group, suggestedExt: fileExtByGroup(group) },
      inputTarget: "saveName",
      inputBuffer: "",
    }));
  };

  const openFileManager = (group, mode = "browse", previousScreen = "main") => {
    setDevice((d) => ({
      ...d,
      previousScreen,
      fileContext: { group, mode },
      fileListIndex: 0,
      screen: previousScreen === "main" ? "fileRoot" : "fileList",
    }));
  };

  const handleInputAction = (action) => {
    if (/^[0-9A-Za-zА-Яа-я ]$/.test(action) || action === "." || action === "-" || action === "_") {
      setDevice((d) => ({ ...d, inputBuffer: `${d.inputBuffer}${action}`.slice(0, 24) }));
      return;
    }

    if (action === "CLEAR") {
      setDevice((d) => ({ ...d, inputBuffer: d.inputBuffer.slice(0, -1) }));
      return;
    }

    if (action !== "ENTER") return;

    const raw = parseFloat(device.inputBuffer || "0");

    if (device.inputTarget === "wavelength") {
      if (Number.isNaN(raw)) return showWarning("Ошибка", "Неверная длина волны", device.returnScreen);
      const wl = clamp(raw, 190, 1100);
      setDevice((d) => ({ ...d, wavelength: wl, inputBuffer: "", inputTarget: null, screen: d.returnScreen }));
      logLine(`swl ${wl.toFixed(1)}`);
      return;
    }

    if (device.inputTarget === "quantK") {
      if (Number.isNaN(raw)) return showWarning("Ошибка", "Неверный K", "quantCoef");
      setDevice((d) => ({ ...d, quantK: raw, inputBuffer: "", inputTarget: null, screen: "quantCoef" }));
      return;
    }

    if (device.inputTarget === "quantB") {
      if (Number.isNaN(raw)) return showWarning("Ошибка", "Неверный B", "quantCoef");
      setDevice((d) => ({ ...d, quantB: raw, inputBuffer: "", inputTarget: null, screen: "quantCoef" }));
      return;
    }

    if (device.inputTarget === "kinUpper") {
      if (Number.isNaN(raw)) return showWarning("Ошибка", "Неверная верх. граница", "kineticsMenu");
      setDevice((d) => ({ ...d, kineticUpper: raw, inputBuffer: "", inputTarget: null, screen: "kineticsMenu" }));
      return;
    }

    if (device.inputTarget === "kinLower") {
      if (Number.isNaN(raw)) return showWarning("Ошибка", "Неверная ниж. граница", "kineticsMenu");
      setDevice((d) => ({ ...d, kineticLower: raw, inputBuffer: "", inputTarget: null, screen: "kineticsMenu" }));
      return;
    }

    if (device.inputTarget === "kinDuration") {
      if (Number.isNaN(raw)) return showWarning("Ошибка", "Неверное время", "kineticsMenu");
      setDevice((d) => ({ ...d, kineticDuration: clamp(Math.round(raw), 10, 1200), inputBuffer: "", inputTarget: null, screen: "kineticsMenu" }));
      return;
    }

    if (device.inputTarget === "saveName") {
      saveCurrentResults();
      return;
    }

    if (device.inputTarget === "renameFile") {
      renameCurrentFile();
    }
  };

  const handleAction = async (action) => {
    if (device.busy) return;

    if (device.screen === "warning") {
      if (action === "ESC" || action === "ENTER") {
        setDevice((d) => ({ ...d, screen: d.warningReturn, warning: null }));
      }
      return;
    }

    if (device.screen === "warmup") {
      setDevice((d) => ({ ...d, screen: "main" }));
      return;
    }

    if (device.screen === "input" || device.screen === "saveDialog") {
      if (action === "ESC") {
        setDevice((d) => ({ ...d, inputBuffer: "", inputTarget: null, screen: d.returnScreen || d.previousScreen || "main" }));
        return;
      }
      handleInputAction(action);
      return;
    }

    if (device.screen === "main") {
      if (action === "UP") setDevice((d) => ({ ...d, mainIndex: (d.mainIndex + MENU_MAIN.length - 1) % MENU_MAIN.length }));
      if (action === "DOWN") setDevice((d) => ({ ...d, mainIndex: (d.mainIndex + 1) % MENU_MAIN.length }));
      if (action === "FILE") return openFileManager(FILE_GROUPS[device.fileRootIndex], "browse", "main");
      if (action === "ENTER") {
        if (device.mainIndex === 0) setDevice((d) => ({ ...d, screen: "photometry" }));
        if (device.mainIndex === 1) setDevice((d) => ({ ...d, screen: "quantMain" }));
        if (device.mainIndex === 2) setDevice((d) => ({ ...d, screen: "kineticsMenu" }));
        if (device.mainIndex === 3) setDevice((d) => ({ ...d, screen: "settings" }));
      }
      return;
    }

    if (device.screen === "fileRoot") {
      if (action === "UP") setDevice((d) => ({ ...d, fileRootIndex: (d.fileRootIndex + FILE_GROUPS.length - 1) % FILE_GROUPS.length }));
      if (action === "DOWN") setDevice((d) => ({ ...d, fileRootIndex: (d.fileRootIndex + 1) % FILE_GROUPS.length }));
      if (action === "ESC") setDevice((d) => ({ ...d, screen: d.previousScreen || "main" }));
      if (action === "ENTER") {
        const group = FILE_GROUPS[device.fileRootIndex];
        setDevice((d) => ({ ...d, fileContext: { ...d.fileContext, group }, screen: "fileList", fileListIndex: 0 }));
      }
      return;
    }

    if (device.screen === "fileList") {
      const list = device.files[device.fileContext.group] || [];
      if (action === "UP") setDevice((d) => ({ ...d, fileListIndex: Math.max(0, d.fileListIndex - 1) }));
      if (action === "DOWN") setDevice((d) => ({ ...d, fileListIndex: Math.min(Math.max(0, list.length - 1), d.fileListIndex + 1) }));
      if (action === "ESC") setDevice((d) => ({ ...d, screen: d.previousScreen === "main" ? "fileRoot" : d.previousScreen }));
      if (action === "ENTER" && list.length) setDevice((d) => ({ ...d, screen: "fileActionMenu", fileActionIndex: 0 }));
      return;
    }

    if (device.screen === "fileActionMenu") {
      const group = device.fileContext.group;
      const files = device.files[group] || [];
      const selected = files[device.fileListIndex];
      if (action === "UP") setDevice((d) => ({ ...d, fileActionIndex: (d.fileActionIndex + FILE_ACTIONS.length - 1) % FILE_ACTIONS.length }));
      if (action === "DOWN") setDevice((d) => ({ ...d, fileActionIndex: (d.fileActionIndex + 1) % FILE_ACTIONS.length }));
      if (action === "ESC") setDevice((d) => ({ ...d, screen: "fileList" }));
      if (action === "ENTER") {
        const currentAction = FILE_ACTIONS[device.fileActionIndex];
        if (currentAction === "Открыть") showWarning("Открытие", `${selected.name}${selected.ext}`, "fileList");
        if (currentAction === "Переименовать") {
          setDevice((d) => ({ ...d, screen: "input", inputTarget: "renameFile", inputBuffer: selected.name, dialogTitle: "Переименовать", returnScreen: "fileActionMenu" }));
        }
        if (currentAction === "Удалить") {
          const next = files.filter((_, idx) => idx !== device.fileListIndex);
          setDevice((d) => ({
            ...d,
            files: { ...d.files, [group]: next },
            screen: "fileList",
            fileListIndex: Math.max(0, Math.min(d.fileListIndex, next.length - 1)),
          }));
          logLine(`delete -> ${selected.name}${selected.ext}`);
        }
        if (currentAction === "Экспорт") {
          const nextFiles = [...files];
          nextFiles[device.fileListIndex] = { ...selected, exported: true };
          const usbRecord = buildCurrentUsbRecord(group, selected.name, selected.ext);
          setDevice((d) => ({
            ...d,
            files: { ...d.files, [group]: nextFiles },
            usbExports: [...d.usbExports, usbRecord],
            usbPreviewIndex: d.usbExports.length,
            screen: "fileList",
          }));
          logLine(`export -> ${selected.name}${selected.ext} -> USB1(csv)`);
          showWarning("Экспорт", `Файл ${selected.name}${selected.ext} отправлен на USB1`, "fileList");
        }
      }
      return;
    }

    if (device.screen === "photometry") {
      if (action === "GOTOλ") return setDevice((d) => ({ ...d, screen: "input", inputTarget: "wavelength", inputBuffer: `${d.wavelength.toFixed(1)}`, dialogTitle: "Введите λ, нм", returnScreen: "photometry" }));
      if (action === "ZERO") return performRezero();
      if (action === "START/STOP") return performPhotometryMeasure();
      if (action === "SET") return setDevice((d) => ({ ...d, screen: "photometryValue" }));
      if (action === "CLEAR") return setDevice((d) => ({ ...d, measurements: d.measurements.slice(0, -1), measurementCursor: Math.max(0, d.measurementCursor - 1) }));
      if (action === "FILE") return device.measurements.length ? openSaveDialog("Фотометрия", "photometry") : openFileManager("Фотометрия", "mode", "photometry");
      if (action === "UP" && device.measurements.length) return setDevice((d) => ({ ...d, measurementCursor: Math.max(0, d.measurementCursor - 1) }));
      if (action === "DOWN") {
        if (!device.measurements.length) return;
        if (device.measurementCursor >= device.measurements.length - 1) return setDevice((d) => ({ ...d, screen: "photometryGraph" }));
        return setDevice((d) => ({ ...d, measurementCursor: Math.min(d.measurements.length - 1, d.measurementCursor + 1) }));
      }
      if (action === "ESC") return setDevice((d) => ({ ...d, screen: "main" }));
      return;
    }

    if (device.screen === "photometryGraph") {
      if (action === "ESC") setDevice((d) => ({ ...d, screen: "photometry" }));
      return;
    }

    if (device.screen === "photometryValue") {
      if (action === "UP") setDevice((d) => ({ ...d, photometryValueIndex: (d.photometryValueIndex + 2) % 3 }));
      if (action === "DOWN") setDevice((d) => ({ ...d, photometryValueIndex: (d.photometryValueIndex + 1) % 3 }));
      if (action === "ENTER" || action === "ESC") setDevice((d) => ({ ...d, screen: "photometry" }));
      return;
    }

    if (device.screen === "quantMain") {
      if (action === "UP") setDevice((d) => ({ ...d, quantIndex: (d.quantIndex + MENU_QUANT.length - 1) % MENU_QUANT.length }));
      if (action === "DOWN") setDevice((d) => ({ ...d, quantIndex: (d.quantIndex + 1) % MENU_QUANT.length }));
      if (action === "FILE") return openFileManager("Градуировка", "mode", "quantMain");
      if (action === "ENTER") {
        if (device.quantIndex === 0) return setDevice((d) => ({ ...d, screen: "calibrationSetupStandards" }));
        if (device.quantIndex === 1) return setDevice((d) => ({ ...d, screen: "quantCoef" }));
        if (device.quantIndex === 2) return setDevice((d) => ({ ...d, screen: "quantUnits" }));
      }
      if (action === "ESC") setDevice((d) => ({ ...d, screen: "main" }));
      return;
    }

    if (device.screen === "quantUnits") {
      if (action === "UP") setDevice((d) => ({ ...d, unitsIndex: (d.unitsIndex + UNITS.length - 1) % UNITS.length }));
      if (action === "DOWN") setDevice((d) => ({ ...d, unitsIndex: (d.unitsIndex + 1) % UNITS.length }));
      if (action === "ENTER" || action === "ESC") setDevice((d) => ({ ...d, screen: "quantMain" }));
      return;
    }

    if (device.screen === "quantCoef") {
      if (action === "START/STOP") return performPhotometryMeasure();
      if (action === "SET") return showWarning("Редактирование", "1=K, 2=B", "quantCoef");
      if (action === "1") return setDevice((d) => ({ ...d, screen: "input", inputTarget: "quantK", inputBuffer: String(d.quantK), dialogTitle: "Введите K", returnScreen: "quantCoef" }));
      if (action === "2") return setDevice((d) => ({ ...d, screen: "input", inputTarget: "quantB", inputBuffer: String(d.quantB), dialogTitle: "Введите B", returnScreen: "quantCoef" }));
      if (action === "GOTOλ") return setDevice((d) => ({ ...d, screen: "input", inputTarget: "wavelength", inputBuffer: `${d.wavelength.toFixed(1)}`, dialogTitle: "Введите λ, нм", returnScreen: "quantCoef" }));
      if (action === "ZERO") return performRezero();
      if (action === "FILE") return openSaveDialog("Коэффициент", "quantCoef");
      if (action === "ESC") setDevice((d) => ({ ...d, screen: "quantMain" }));
      return;
    }

    if (device.screen === "calibrationSetupStandards") {
      if (action === "UP") setDevice((d) => ({ ...d, calibration: { ...d.calibration, standards: clamp(d.calibration.standards + 1, 1, 9) } }));
      if (action === "DOWN") setDevice((d) => ({ ...d, calibration: { ...d.calibration, standards: clamp(d.calibration.standards - 1, 1, 9) } }));
      if (action === "ENTER") setDevice((d) => ({ ...d, screen: "calibrationSetupParallels" }));
      if (action === "ESC") setDevice((d) => ({ ...d, screen: "quantMain" }));
      return;
    }

    if (device.screen === "calibrationSetupParallels") {
      if (action === "UP") setDevice((d) => ({ ...d, calibration: { ...d.calibration, parallels: clamp(d.calibration.parallels + 1, 1, 9) } }));
      if (action === "DOWN") setDevice((d) => ({ ...d, calibration: { ...d.calibration, parallels: clamp(d.calibration.parallels - 1, 1, 9) } }));
      if (action === "ENTER") {
        setDevice((d) => ({
          ...d,
          calibration: {
            ...d.calibration,
            stepIndex: 0,
            resultCursor: 0,
            plan: buildCalibrationPlan(d.calibration.standards, d.calibration.parallels),
          },
          screen: "calibrationPlan",
        }));
      }
      if (action === "ESC") setDevice((d) => ({ ...d, screen: "calibrationSetupStandards" }));
      return;
    }

    if (device.screen === "calibrationPlan") {
      if (action === "ZERO") return performRezero();
      if (action === "ENTER") return setDevice((d) => ({ ...d, screen: "calibrationStep" }));
      if (action === "DOWN") {
        const lastMeasured = getCalibrationResultIndexes(device.calibration.plan).at(-1);
        if (typeof lastMeasured === "number") {
          return setDevice((d) => ({ ...d, calibration: { ...d.calibration, resultCursor: lastMeasured }, screen: "calibrationJournal" }));
        }
        return;
      }
      if (action === "FILE") return openFileManager("Градуировка", "mode", "calibrationPlan");
      if (action === "ESC") return setDevice((d) => ({ ...d, screen: "quantMain" }));
      return;
    }

    if (device.screen === "calibrationStep") {
      if (action === "ZERO") return performRezero();
      if (action === "START/STOP") return performCalibrationMeasure();
      if (action === "FILE") return openSaveDialog("Градуировка", "calibrationStep");
      if (action === "ESC") return setDevice((d) => ({ ...d, screen: "calibrationPlan" }));
      return;
    }

    if (device.screen === "calibrationJournal") {
      if (action === "UP") return moveCalibrationCursor("up");
      if (action === "DOWN") return moveCalibrationCursor("down");
      if (action === "ENTER") return nextCalibrationStep();
      if (action === "START/STOP") return remeasureCalibrationAtCursor();
      if (action === "CLEAR") return deleteCalibrationAtCursor();
      if (action === "FILE") return openSaveDialog("Градуировка", "calibrationJournal");
      if (action === "ESC") return setDevice((d) => ({ ...d, screen: "calibrationPlan" }));
      if (action === "ZERO") return performRezero();
      return;
    }

    if (device.screen === "calibrationGraph") {
      if (action === "FILE") return openSaveDialog("Градуировка", "calibrationGraph");
      if (action === "ESC") return setDevice((d) => ({ ...d, screen: "calibrationJournal" }));
      return;
    }

    if (device.screen === "kineticsMenu") {
      if (action === "UP") setDevice((d) => ({ ...d, kineticsIndex: (d.kineticsIndex + MENU_KINETICS.length - 1) % MENU_KINETICS.length }));
      if (action === "DOWN") setDevice((d) => ({ ...d, kineticsIndex: (d.kineticsIndex + 1) % MENU_KINETICS.length }));
      if (action === "ENTER") {
        if (device.kineticsIndex === 1) return setDevice((d) => ({ ...d, screen: "input", inputTarget: "kinUpper", inputBuffer: String(d.kineticUpper), dialogTitle: "Верх. граница", returnScreen: "kineticsMenu" }));
        if (device.kineticsIndex === 2) return setDevice((d) => ({ ...d, screen: "input", inputTarget: "kinLower", inputBuffer: String(d.kineticLower), dialogTitle: "Ниж. граница", returnScreen: "kineticsMenu" }));
        if (device.kineticsIndex === 3) return setDevice((d) => ({ ...d, screen: "input", inputTarget: "kinDuration", inputBuffer: String(d.kineticDuration), dialogTitle: "Время, с", returnScreen: "kineticsMenu" }));
        if (device.kineticsIndex === 4) return startKinetics();
      }
      if (action === "ZERO") return performRezero();
      if (action === "GOTOλ") return setDevice((d) => ({ ...d, screen: "input", inputTarget: "wavelength", inputBuffer: `${d.wavelength.toFixed(1)}`, dialogTitle: "Введите λ, нм", returnScreen: "kineticsMenu" }));
      if (action === "FILE") return openFileManager("Кинетика", "mode", "kineticsMenu");
      if (action === "ESC") setDevice((d) => ({ ...d, screen: "main" }));
      return;
    }

    if (device.screen === "kineticsRun") {
      if (action === "START/STOP") return stopKinetics();
      if (action === "DOWN") return setDevice((d) => ({ ...d, screen: "kineticsGraph" }));
      if (action === "FILE") return openSaveDialog("Кинетика", "kineticsRun");
      if (action === "ESC") return stopKinetics();
      return;
    }

    if (device.screen === "kineticsGraph") {
      if (action === "ESC") setDevice((d) => ({ ...d, screen: "kineticsRun" }));
      return;
    }

    if (device.screen === "settings") {
      if (action === "UP") setDevice((d) => ({ ...d, settingsIndex: (d.settingsIndex + MENU_SETTINGS.length - 1) % MENU_SETTINGS.length }));
      if (action === "DOWN") setDevice((d) => ({ ...d, settingsIndex: (d.settingsIndex + 1) % MENU_SETTINGS.length }));
      if (action === "ENTER") {
        if (device.settingsIndex === 0) return setDevice((d) => ({ ...d, d2Lamp: !d.d2Lamp }));
        if (device.settingsIndex === 1) return setDevice((d) => ({ ...d, wLamp: !d.wLamp }));
        if (device.settingsIndex === 2) return performDarkCurrent();
        if (device.settingsIndex === 3) return performWavelengthCalibration();
        if (device.settingsIndex === 4) return setDevice((d) => ({ ...d, screen: "version" }));
        if (device.settingsIndex === 5) return setDevice(initialDevice());
      }
      if (action === "ESC") setDevice((d) => ({ ...d, screen: "main" }));
      return;
    }

    if (device.screen === "version") {
      if (action === "ENTER" || action === "ESC") setDevice((d) => ({ ...d, screen: "settings" }));
    }
  };

  useEffect(() => {
    const handler = (e) => {
      const keyMap = { Enter: "ENTER", Escape: "ESC", ArrowUp: "UP", ArrowDown: "DOWN" };
      if (keyMap[e.key]) {
        e.preventDefault();
        handleAction(keyMap[e.key]);
        return;
      }
      if (/^[0-9A-Za-zА-Яа-я ]$/.test(e.key) || e.key === "." || e.key === "-" || e.key === "_") {
        handleAction(e.key);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const executeCli = async (command) => {
    const cmd = command.trim();
    if (!cmd) return;
    logLine(`> ${cmd}`);
    const [op, arg] = cmd.split(/\s+/);
    const reply = (line) => logLine(String(line));
    const replyBlank = () => logLine("");

    if (op === "help") {
      reply("Command List:");
      reply(CLI_COMMANDS.join("   "));
      return;
    }
    if (op === "connect") {
      await sleep(50);
      reply("ok.");
      return;
    }
    if (op === "quit") return replyBlank();
    if (op === "company") return reply(device.company);
    if (op === "getsoftver") return reply(device.softwareVersion);
    if (op === "gethardver") return reply(device.hardwareVersion);
    if (op === "startwl") return reply(" 190.0");
    if (op === "endwl") return reply("1100.0");
    if (op === "getwl") return reply(` ${device.wavelength.toFixed(1)}`);
    if (op === "swl" || op === "swm") {
      const wl = clamp(parseFloat(arg || String(device.wavelength)), 190, 1100);
      setDevice((d) => ({ ...d, wavelength: wl }));
      await setBusy(op === "swl" ? "Установка λ" : "Поворот решётки", op === "swl" ? 900 : 650);
      return replyBlank();
    }
    if (op === "rezero") {
      const e100 = addNoise(referenceEnergyAt(device.wavelength), 10);
      setDevice((d) => ({ ...d, e100, gain: 1, lastEnergy: e100, lastComputedA: 0, lastComputedT: 100 }));
      await sleep(350);
      reply(e100);
      reply(1);
      return replyBlank();
    }
    if (op === "resetdark") {
      await sleep(450);
      DARK_VALUES.forEach((v) => reply(v));
      setDevice((d) => ({ ...d, darkValues: [...DARK_VALUES] }));
      return replyBlank();
    }
    if (op === "getdark") {
      device.darkValues.forEach((v) => reply(v));
      return replyBlank();
    }
    if (op === "ge") {
      const count = clamp(parseInt(arg || "1", 10) || 1, 1, 8);
      for (let i = 0; i < count; i += 1) {
        const m = measureSample(device.currentSample, device.wavelength, device.gain, device.e100, device.darkValues);
        reply(m.energy);
        setDevice((d) => ({ ...d, lastEnergy: m.energy, lastComputedA: m.a, lastComputedT: m.t }));
      }
      return replyBlank();
    }
    if (op === "sa") {
      const gain = clamp(parseInt(arg || "1", 10) || 1, 1, 8);
      setDevice((d) => ({ ...d, gain }));
      return replyBlank();
    }
    if (op === "ga") {
      reply(device.gain);
      return replyBlank();
    }
    if (op === "setlampwl") {
      const v = parseFloat(arg || String(device.lampWL));
      setDevice((d) => ({ ...d, lampWL: v }));
      return replyBlank();
    }
    if (op === "getlampwl") return reply(` ${device.lampWL.toFixed(1)}`);
    if (op === "wuon") {
      setDevice((d) => ({ ...d, wLamp: true }));
      return replyBlank();
    }
    if (op === "wuoff") {
      setDevice((d) => ({ ...d, wLamp: false }));
      return replyBlank();
    }
    if (op === "d2on") {
      setDevice((d) => ({ ...d, d2Lamp: true }));
      return replyBlank();
    }
    if (op === "d2off") {
      setDevice((d) => ({ ...d, d2Lamp: false }));
      return replyBlank();
    }
    if (op === "getd2") return reply(device.d2Lamp ? 1 : 0);
    if (op === "getwu") return reply(device.wLamp ? 1 : 0);
    if (op === "getslip") return reply(device.slip);
    if (op === "setslip") {
      const slip = clamp(parseInt(arg || "2", 10) || 2, 1, 4);
      setDevice((d) => ({ ...d, slip }));
      return replyBlank();
    }
    if (op === "getsampler") return reply(device.sampler);
    if (op === "setsampler") return reply("Error");
    if (op === "adjustwl") {
      await setBusy("Калибровка λ", 1600);
      return replyBlank();
    }
    if (op === "diag") {
      ["Filter=3", "Lamp=3", "Sensor=3", "D2 Lamp=3", "W Lamp=3", "Calib. WL=3", "System=3", "Dark=3"].forEach(reply);
      return;
    }
    if (["setfilter", "setlamp", "ud", "cap", "btcfg", "btcheck"].includes(op)) return replyBlank();
    if (op === "gettype") return reply("ECROS-5400UV");
    reply("Unknown command");
  };

  const panelDigits = [["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], ["0", ".", "-"]];
  const visibleMeasurements = device.measurements.slice(-8);
  const selectedFile = (device.files[device.fileContext.group] || [])[device.fileListIndex];
  const calibrationDone = getCalibrationDoneCount(device.calibration.plan);
  const selectedUsbExport = device.usbExports[device.usbPreviewIndex] || null;

  return (
    <div className="min-h-screen bg-zinc-100 p-4 text-zinc-900">
      <div className="mx-auto max-w-[1760px] space-y-4">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Симулятор ЭКРОС‑5400УФ</h1>
              <p className="text-sm text-zinc-600">Bitmap-LCD рендер 128×64, инверсия строк, файловый менеджер, графики на LCD, мастер новой градуировки и USB-предпросмотр экспортов.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-zinc-600">
              <span className="rounded-full bg-zinc-100 px-3 py-1">Диапазон: 190–1100 нм</span>
              <span className="rounded-full bg-zinc-100 px-3 py-1">LCD: 128×64 × {LCD_SCALE}</span>
              <span className="rounded-full bg-zinc-100 px-3 py-1">SW {device.softwareVersion}</span>
              <span className="rounded-full bg-zinc-100 px-3 py-1">HW {device.hardwareVersion}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[680px_1fr_460px]">
          <div className="rounded-[32px] border border-emerald-700 bg-emerald-600 p-5 shadow-lg">
            <div className="mb-4 rounded-2xl border border-emerald-300/60 px-4 py-3 text-center text-3xl font-semibold tracking-wide text-white">СПЕКТРОФОТОМЕТР ЭКРОС‑5400УФ</div>
            <div className="mx-auto mb-5 flex justify-center rounded-[26px] border-4 border-emerald-200 bg-emerald-500 px-5 py-5">
              <LcdCanvas device={device} />
            </div>
            <div className="grid grid-cols-[1fr_1fr_1fr_120px_1fr] gap-3">
              <ButtonKey label="ФАЙЛ" onClick={() => handleAction("FILE")} />
              <ButtonKey label="ОЧИСТИТЬ" onClick={() => handleAction("CLEAR")} />
              <ButtonKey label="ПЕЧАТЬ" onClick={() => handleAction("PRINT")} />
              <div className="row-span-5 flex flex-col items-center justify-center gap-3">
                <button onClick={() => handleAction("UP")} className="flex h-16 w-16 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-2xl text-emerald-700 shadow-sm">▲</button>
                <button onClick={() => handleAction("DOWN")} className="flex h-16 w-16 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-2xl text-emerald-700 shadow-sm">▼</button>
                <button onClick={() => handleAction("ESC")} className="flex min-h-[56px] min-w-[78px] items-center justify-center rounded-2xl border border-zinc-300 bg-zinc-100 px-3 py-2 font-semibold text-emerald-700 shadow-sm">ESC</button>
              </div>
              <ButtonKey label="ПАРАМЕТРЫ" onClick={() => handleAction("SET")} />
              {panelDigits.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  {row.map((digit) => (
                    <ButtonKey
                      key={digit}
                      label={digit}
                      sublabel={digit === "2" ? "ABC" : digit === "3" ? "DEF" : digit === "4" ? "GHI" : digit === "5" ? "JKL" : digit === "6" ? "MNO" : digit === "7" ? "PQRS" : digit === "8" ? "TUV" : digit === "9" ? "WXYZ" : ""}
                      onClick={() => handleAction(digit)}
                    />
                  ))}
                  <ButtonKey
                    label={rowIndex === 0 ? "ПЕРЕХОД λ" : rowIndex === 1 ? "НОЛЬ" : rowIndex === 2 ? "START" : "ВВОД"}
                    onClick={() => handleAction(rowIndex === 0 ? "GOTOλ" : rowIndex === 1 ? "ZERO" : rowIndex === 2 ? "START/STOP" : "ENTER")}
                    className={rowIndex === 2 ? "text-[13px]" : ""}
                    tall={rowIndex === 2}
                  />
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Состояние прибора</h2>
                  <button onClick={() => setDevice(initialDevice())} className="rounded-xl border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50">Полный сброс</button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-zinc-50 p-3"><div className="text-zinc-500">Длина волны</div><div className="text-xl font-semibold">{device.wavelength.toFixed(1)} нм</div></div>
                  <div className="rounded-2xl bg-zinc-50 p-3"><div className="text-zinc-500">Усиление</div><div className="text-xl font-semibold">{device.gain}</div></div>
                  <div className="rounded-2xl bg-zinc-50 p-3"><div className="text-zinc-500">Энергия</div><div className="text-xl font-semibold">{device.lastEnergy}</div></div>
                  <div className="rounded-2xl bg-zinc-50 p-3"><div className="text-zinc-500">Режим</div><div className="text-xl font-semibold">{device.screen}</div></div>
                  <div className="rounded-2xl bg-zinc-50 p-3"><div className="text-zinc-500">A</div><div className="text-xl font-semibold">{device.lastComputedA.toFixed(3)}</div></div>
                  <div className="rounded-2xl bg-zinc-50 p-3"><div className="text-zinc-500">%T</div><div className="text-xl font-semibold">{device.lastComputedT.toFixed(1)}</div></div>
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold">Виртуальный образец</h2>
                <div className="space-y-3 text-sm">
                  <label className="block">
                    <div className="mb-1 text-zinc-500">Что находится в луче</div>
                    <select value={device.currentSample} onChange={(e) => setDevice((d) => ({ ...d, currentSample: e.target.value }))} className="w-full rounded-2xl border border-zinc-300 px-3 py-2">
                      {sampleOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="rounded-2xl bg-zinc-50 p-3"><div className="mb-1 text-zinc-500">D2‑лампа</div><input type="checkbox" checked={device.d2Lamp} onChange={(e) => setDevice((d) => ({ ...d, d2Lamp: e.target.checked }))} /></label>
                    <label className="rounded-2xl bg-zinc-50 p-3"><div className="mb-1 text-zinc-500">W‑лампа</div><input type="checkbox" checked={device.wLamp} onChange={(e) => setDevice((d) => ({ ...d, wLamp: e.target.checked }))} /></label>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button onClick={performRezero} className="rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">Кнопка НОЛЬ</button>
                    <button onClick={performPhotometryMeasure} className="rounded-2xl border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50">Кнопка START</button>
                    <button onClick={performDarkCurrent} className="rounded-2xl border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50">Темновой ток</button>
                    <button onClick={performWavelengthCalibration} className="rounded-2xl border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50">Calibrate WL</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Последние результаты</h2>
                <div className="text-sm text-zinc-500">↓ после последней строки открывает график на LCD</div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-zinc-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-3 py-2 text-left">№</th>
                      <th className="px-3 py-2 text-left">λ, нм</th>
                      <th className="px-3 py-2 text-left">Энергия</th>
                      <th className="px-3 py-2 text-left">A</th>
                      <th className="px-3 py-2 text-left">%T</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleMeasurements.map((m, idx) => {
                      const globalIndex = Math.max(0, device.measurements.length - visibleMeasurements.length) + idx;
                      const active = globalIndex === device.measurementCursor && device.screen === "photometry";
                      return (
                        <tr key={m.index} className={`border-t border-zinc-100 ${active ? "bg-zinc-900 text-white" : ""}`}>
                          <td className="px-3 py-2">{m.index}</td>
                          <td className="px-3 py-2">{m.wavelength.toFixed(1)}</td>
                          <td className="px-3 py-2">{m.energy}</td>
                          <td className="px-3 py-2">{m.a.toFixed(3)}</td>
                          <td className="px-3 py-2">{m.t.toFixed(1)}</td>
                        </tr>
                      );
                    })}
                    {device.measurements.length === 0 ? <tr><td className="px-3 py-8 text-center text-zinc-400" colSpan={5}>Результатов пока нет</td></tr> : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold">CLI‑эмулятор</h2>
              <div className="mb-3 rounded-2xl bg-zinc-950 p-3 font-mono text-xs text-emerald-300">
                <div className="mb-2 h-[260px] overflow-auto whitespace-pre-wrap break-words">
                  {device.logLines.map((line, i) => <div key={`${line}-${i}`}>{line || " "}</div>)}
                </div>
                <div className="flex gap-2">
                  <input value={cliValue} onChange={(e) => setCliValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") executeCli(cliValue); }} className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-emerald-200 outline-none" placeholder="Например: rezero или swl 500" />
                  <button onClick={() => executeCli(cliValue)} className="rounded-xl bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700">Send</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {["help", "rezero", "getdark", "resetdark", "ge 2", "swl 300", "getwl", "ga", "getsoftver", "adjustwl", "diag"].map((cmd) => (
                  <button key={cmd} onClick={() => { setCliValue(cmd); executeCli(cmd); }} className="rounded-full border border-zinc-300 px-3 py-1 hover:bg-zinc-50">{cmd}</button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold">USB-накопитель</h2>
              <div className="mb-3 grid gap-3 lg:grid-cols-[180px_1fr]">
                <div className="space-y-2">
                  {device.usbExports.length === 0 ? (
                    <div className="rounded-2xl bg-zinc-50 p-3 text-sm text-zinc-500">Экспортов пока нет</div>
                  ) : (
                    device.usbExports.map((item, idx) => (
                      <button
                        key={item.id}
                        onClick={() => setDevice((d) => ({ ...d, usbPreviewIndex: idx }))}
                        className={`w-full rounded-2xl border px-3 py-2 text-left text-sm ${idx === device.usbPreviewIndex ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-zinc-50"}`}
                      >
                        <div className="font-medium">{item.name}{item.ext}</div>
                        <div className="text-xs opacity-80">{item.group} → {item.target}</div>
                      </button>
                    ))
                  )}
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-950 p-3 font-mono text-xs text-emerald-300">
                  {selectedUsbExport ? (
                    <>
                      <div className="mb-2 text-zinc-300">Последний просмотр: {selectedUsbExport.exportedAt}</div>
                      <pre className="max-h-[280px] overflow-auto whitespace-pre-wrap break-words">{selectedUsbExport.content}</pre>
                    </>
                  ) : (
                    <div className="text-zinc-500">Здесь появится предпросмотр данных, экспортированных на внешний USB-накопитель.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold">Навигация и файлы</h2>
              <div className="space-y-2 text-sm text-zinc-700">
                <div className="rounded-2xl bg-zinc-50 p-3">Файл: {device.fileContext.group} {selectedFile ? `→ ${selectedFile.name}${selectedFile.ext}` : ""}</div>
                <div className="rounded-2xl bg-zinc-50 p-3">Доступные разделы: {FILE_GROUPS.join(", ")}</div>
                <div className="rounded-2xl bg-zinc-50 p-3">Новая градуировка: {device.calibration.standards} стандартов × {device.calibration.parallels} параллелей</div>
                <div className="rounded-2xl bg-zinc-50 p-3">Шагов выполнено: {calibrationDone} / {device.calibration.plan.length}</div>
                <div className="rounded-2xl bg-zinc-50 p-3">LCD теперь рисуется как набор битовых глифов, а не через текстовый canvas.</div>
                <div className="rounded-2xl bg-zinc-50 p-3">Сохранение: ручной ввод имени, предупреждения при пустом/длинном/занятом имени</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
