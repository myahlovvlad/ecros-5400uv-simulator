import fs from "node:fs/promises";
import path from "node:path";
import { LCD_H, LCD_W } from "../src/domain/constants/index.js";
import { initialDevice, buildCalibrationPlan, buildMultiWaveMeasurement } from "../src/domain/usecases/index.js";
import { getLcdRows } from "../src/infrastructure/adapters/LcdRenderer.js";
import {
  LCD_BG,
  LCD_FG,
  LCD_TEXT_MAX_WIDTH,
  measureRows,
  renderDeviceToMatrix,
} from "../src/presentation/utils/lcdBitmap.js";

const OUTPUT_DIR = path.resolve("artifacts/lcd-audit");
const SCALE = 6;

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function writeBmp(filepath, matrix, scale = SCALE) {
  const [bgR, bgG, bgB] = hexToRgb(LCD_BG);
  const [fgR, fgG, fgB] = hexToRgb(LCD_FG);
  const width = LCD_W * scale;
  const height = LCD_H * scale;
  const rowStride = Math.ceil((width * 3) / 4) * 4;
  const pixelArraySize = rowStride * height;
  const fileSize = 54 + pixelArraySize;
  const buffer = Buffer.alloc(fileSize);

  buffer.write("BM", 0, 2, "ascii");
  buffer.writeUInt32LE(fileSize, 2);
  buffer.writeUInt32LE(54, 10);
  buffer.writeUInt32LE(40, 14);
  buffer.writeInt32LE(width, 18);
  buffer.writeInt32LE(height, 22);
  buffer.writeUInt16LE(1, 26);
  buffer.writeUInt16LE(24, 28);
  buffer.writeUInt32LE(pixelArraySize, 34);

  let offset = 54;
  for (let y = height - 1; y >= 0; y -= 1) {
    const sourceY = Math.floor(y / scale);
    for (let x = 0; x < width; x += 1) {
      const sourceX = Math.floor(x / scale);
      const pixel = matrix[sourceY][sourceX];
      buffer[offset++] = pixel ? fgB : bgB;
      buffer[offset++] = pixel ? fgG : bgG;
      buffer[offset++] = pixel ? fgR : bgR;
    }
    while ((offset - 54) % rowStride !== 0) {
      buffer[offset++] = 0;
    }
  }

  return fs.writeFile(filepath, buffer);
}

function matrixToSvg(matrix, scale = SCALE) {
  const width = LCD_W * scale;
  const height = LCD_H * scale;
  const rects = [`<rect width="${width}" height="${height}" fill="${LCD_BG}"/>`];

  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (!value) return;
      rects.push(`<rect x="${x * scale}" y="${y * scale}" width="${scale}" height="${scale}" fill="${LCD_FG}"/>`);
    });
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">
${rects.join("\n")}
</svg>`;
}

function createFixtures() {
  const base = initialDevice();
  const measuredPlan = buildCalibrationPlan(3, 2).map((step, index) => ({
    ...step,
    result: index < 4 ? { a: 0.123 + index * 0.111, t: 88 - index * 3.4, energy: 12340 + index * 321 } : null,
  }));

  const multiBase = {
    ...base,
    currentSample: "sampleA",
    multiWaveCount: 3,
    multiWaveParallelCount: 2,
    multiWaveWavelengths: [412.5, 540, 620.3, 700, 820],
  };
  const multiMeasurement = buildMultiWaveMeasurement(multiBase);

  return {
    boot: { ...base, screen: "boot" },
    diagnostic: { ...base, screen: "diagnostic", diagIndex: 3 },
    warmup: { ...base, screen: "warmup", warmupRemaining: 745 },
    main: { ...base, screen: "main", mainIndex: 3 },
    photometry: {
      ...base,
      screen: "photometry",
      currentSample: "sampleA",
      measurements: [{ index: 1, wavelength: 546.2, a: 0.184, t: 65.4, energy: 22110 }],
      lastComputedA: 0.184,
      lastComputedT: 65.4,
      lastEnergy: 22110,
    },
    photometryValue: { ...base, screen: "photometryValue", photometryValueIndex: 2 },
    photometryGraph: { ...base, screen: "photometryGraph", measurements: [{ a: 0.11 }, { a: 0.36 }, { a: 0.28 }], wavelength: 546.2, lastComputedA: 0.28 },
    fileRoot: { ...base, screen: "fileRoot", fileRootIndex: 4 },
    fileList: { ...base, screen: "fileList", fileContext: { mode: "browse", group: "МНОГОВОЛН." }, fileListIndex: 0 },
    fileActionMenu: { ...base, screen: "fileActionMenu", fileContext: { mode: "browse", group: "ФОТОМЕТРИЯ" }, fileListIndex: 1, fileActionIndex: 3 },
    saveDialog: { ...base, screen: "saveDialog", saveMeta: { group: "МНОГОВОЛН.", suggestedExt: ".mwv" }, inputBuffer: "MW_SCAN_02" },
    input: { ...base, screen: "input", dialogTitle: "ВВЕДИТЕ ДЛИНУ ВОЛНЫ", inputBuffer: "546.2" },
    quantMain: { ...base, screen: "quantMain", quantIndex: 0, quantK: 1.234, quantB: 0.056 },
    quantUnits: { ...base, screen: "quantUnits", unitsIndex: 6 },
    quantCoef: { ...base, screen: "quantCoef", wavelength: 540, lastComputedA: 0.412, quantK: 2.154, quantB: 0.042 },
    calibrationSetupStandards: { ...base, screen: "calibrationSetupStandards", calibration: { ...base.calibration, standards: 5 } },
    calibrationSetupParallels: { ...base, screen: "calibrationSetupParallels", calibration: { ...base.calibration, parallels: 4 } },
    calibrationPlan: { ...base, screen: "calibrationPlan", calibration: { ...base.calibration, standards: 3, parallels: 2, plan: measuredPlan, stepIndex: 4 } },
    calibrationStep: { ...base, screen: "calibrationStep", calibration: { ...base.calibration, plan: measuredPlan, stepIndex: 2 } },
    calibrationJournal: { ...base, screen: "calibrationJournal", calibration: { ...base.calibration, plan: measuredPlan, resultCursor: 2 } },
    calibrationGraph: { ...base, screen: "calibrationGraph", calibration: { ...base.calibration, plan: measuredPlan } },
    kineticsMenu: { ...base, screen: "kineticsMenu", kineticsIndex: 4, kineticDuration: 120, kineticLower: 0.05, kineticUpper: 1.8 },
    kineticsRun: { ...base, screen: "kineticsRun", kineticPoints: [{ time: 0, value: 0.12 }, { time: 5, value: 0.25 }, { time: 10, value: 0.41 }], lastComputedA: 0.41, lastComputedT: 38.8 },
    kineticsGraph: { ...base, screen: "kineticsGraph", kineticLower: 0.05, kineticUpper: 1.2, kineticPoints: [{ time: 0, value: 0.11 }, { time: 5, value: 0.2 }, { time: 10, value: 0.42 }, { time: 15, value: 0.67 }], lastComputedA: 0.67, lastComputedT: 21.4 },
    multiWaveMenu: { ...multiBase, screen: "multiWaveMenu", multiWaveIndex: 4, unitsIndex: 6, photometryValueIndex: 2 },
    multiWaveSetup: { ...multiBase, screen: "multiWaveSetup", multiWaveSetupIndex: 1 },
    multiWaveRun: { ...multiBase, screen: "multiWaveRun", multiWaveGraphData: multiMeasurement.points },
    multiWaveJournal: { ...multiBase, screen: "multiWaveJournal", multiWaveMeasurements: [multiMeasurement], multiWaveMeasurementCursor: 0 },
    multiWaveGraph: { ...multiBase, screen: "multiWaveGraph", multiWaveGraphData: multiMeasurement.points, photometryValueIndex: 1 },
    settings: { ...base, screen: "settings", settingsIndex: 4, d2Lamp: false, wLamp: true },
    version: { ...base, screen: "version" },
    warning: { ...base, screen: "warning", warning: { title: "ОШИБКА USB", body: "ФАЙЛ НЕ СОХРАНЕН" } },
  };
}

function inferIssues(screen, device) {
  const rows = getLcdRows(device);
  const rowMetrics = measureRows(rows);
  const issues = [];

  rowMetrics.filter((metric) => metric.overflow).forEach((metric) => {
    issues.push(`overflow row ${metric.row}: "${metric.text}" (${metric.width}px > ${LCD_TEXT_MAX_WIDTH}px)`);
  });

  return { rows, rowMetrics, issues };
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const fixtures = createFixtures();
  const report = [];
  const cards = [];

  for (const [screen, device] of Object.entries(fixtures)) {
    const matrix = renderDeviceToMatrix(device);
    const bmpPath = path.join(OUTPUT_DIR, `${screen}.bmp`);
    const svgPath = path.join(OUTPUT_DIR, `${screen}.svg`);
    await writeBmp(bmpPath, matrix);
    await fs.writeFile(svgPath, matrixToSvg(matrix), "utf8");

    const audit = inferIssues(screen, device);
    report.push({
      screen,
      issues: audit.issues,
      rows: audit.rowMetrics,
    });

    cards.push(`
      <article>
        <h2>${screen}</h2>
        <img src="./${screen}.bmp" alt="${screen}" />
        <pre>${audit.rowMetrics.map((row) => `${String(row.row).padStart(2, "0")}. ${row.text} [${row.width}px${row.overflow ? " overflow" : ""}]`).join("\n")}</pre>
        <ul>${audit.issues.map((issue) => `<li>${issue}</li>`).join("") || "<li>no flagged issues</li>"}</ul>
      </article>
    `);
  }

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>LCD Audit</title>
  <style>
    body { font-family: ui-monospace, Consolas, monospace; background: #f3f4f6; margin: 0; padding: 24px; }
    main { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 18px; }
    article { background: white; border: 1px solid #d4d4d8; border-radius: 14px; padding: 14px; }
    h1 { margin-top: 0; }
    h2 { font-size: 14px; margin: 0 0 12px; }
    img { display: block; width: ${LCD_W * SCALE}px; height: ${LCD_H * SCALE}px; image-rendering: pixelated; border: 1px solid #cbd5e1; background: ${LCD_BG}; margin-bottom: 12px; }
    pre { white-space: pre-wrap; font-size: 11px; line-height: 1.35; background: #f8fafc; border-radius: 8px; padding: 10px; }
    ul { margin: 10px 0 0; padding-left: 18px; font-size: 12px; }
  </style>
</head>
<body>
  <h1>LCD Screen Audit</h1>
  <main>${cards.join("\n")}</main>
</body>
</html>`;

  await fs.writeFile(path.join(OUTPUT_DIR, "index.html"), html, "utf8");
  await fs.writeFile(path.join(OUTPUT_DIR, "report.json"), JSON.stringify(report, null, 2), "utf8");
  await fs.writeFile(
    path.join(OUTPUT_DIR, "report.md"),
    report.map((item) => [
      `## ${item.screen}`,
      item.issues.length ? item.issues.map((issue) => `- ${issue}`).join("\n") : "- no flagged issues",
      item.rows.map((row) => `- row ${row.row}: \`${row.text}\` (${row.width}px${row.overflow ? ", overflow" : ""})`).join("\n"),
      "",
    ].join("\n")).join("\n"),
    "utf8",
  );

  const lines = report.flatMap((item) =>
    item.issues.length
      ? [`${item.screen}:`, ...item.issues.map((issue) => `  - ${issue}`)]
      : [],
  );
  console.log(`Generated ${Object.keys(fixtures).length} LCD screenshots in ${OUTPUT_DIR}`);
  if (lines.length) console.log(lines.join("\n"));
}

await main();
