import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { LCD_H, LCD_W } from "../src/domain/constants/index.js";
import { initialDevice, buildCalibrationPlan, buildMultiWaveMeasurement } from "../src/domain/usecases/index.js";
import { getLcdRows } from "../src/infrastructure/adapters/LcdRenderer.js";
import { LCD_BG, LCD_FG, renderDeviceToMatrix } from "../src/presentation/utils/lcdBitmap.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "docs", "specifications");
const GENERATED_DIR = path.join(OUT_DIR, "generated");
const REGISTRY_PATH = path.join(ROOT, "src", "domain", "constants", "screens.json");
const HTML_ONLY = process.argv.includes("--html-only");
const SCALE = 4;

const OUTPUTS = {
  ru: {
    specHtml: "SCREEN-LCD-SPECIFICATION-ECROS-5400UV-RU.html",
    specPdf: "SCREEN-LCD-SPECIFICATION-ECROS-5400UV-RU.pdf",
    mapHtml: "screenmap-ru.html",
    data: "screen-lcd-spec-data-ru.json",
  },
  en: {
    specHtml: "SCREEN-LCD-SPECIFICATION-ECROS-5400UV-EN.html",
    specPdf: "SCREEN-LCD-SPECIFICATION-ECROS-5400UV-EN.pdf",
    mapHtml: "screenmap-en.html",
    data: "screen-lcd-spec-data-en.json",
  },
};

const MODE_ORDER = ["system", "main", "photometry", "quantitative", "kinetics", "multiWave", "settings", "files", "shared"];
const CONTEXT_TARGETS = new Set(["returnScreen", "previousScreen", "warningReturn"]);

const LABELS = {
  ru: {
    docTitle: "ECROS-5400UV: спецификация LCD-экранов",
    mapTitle: "ECROS-5400UV: карта LCD-экранов",
    version: "Версия",
    date: "Дата",
    source: "Источник правды",
    sourceNote: "Документ сгенерирован из src/domain/constants/screens.json. Исходные Screen ID из txt-файлов сохранены как трассировочные метаданные и не используются как уникальные ключи.",
    indexRules: "Правила единой индексации",
    stateContext: "Глобальные переменные состояния",
    conflictMatrix: "Матрица конфликтов исходной индексации",
    screens: "Экраны",
    lcdPreview: "LCD-макет",
    description: "Описание окна",
    purpose: "Назначение",
    meaning: "Информационный смысл",
    content: "Наполнение",
    relation: "Связь с другими окнами",
    stateTable: "Таблица состояния",
    transitions: "Маршруты переходов",
    id: "ID",
    canonicalId: "Единый индекс",
    legacyWnd: "Legacy WND",
    mode: "Режим",
    kind: "Тип",
    status: "Статус",
    integrity: "Целостность источников",
    sourceIds: "Исходные Screen ID",
    field: "Поле",
    type: "Тип/значение",
    usage: "Источник/использование",
    action: "Действие/кнопка",
    guard: "Условие",
    operation: "Операция",
    target: "Целевой экран",
    allModes: "Все режимы",
    allStatuses: "Все статусы",
    search: "Поиск",
    details: "Детали",
    close: "Закрыть",
    routeList: "Список переходов",
    tree: "Дерево режимов",
    empty: "Нет данных",
  },
  en: {
    docTitle: "ECROS-5400UV: LCD Screen Specification",
    mapTitle: "ECROS-5400UV: LCD Screen Map",
    version: "Version",
    date: "Date",
    source: "Source of truth",
    sourceNote: "This document is generated from src/domain/constants/screens.json. Source Screen IDs from txt files are preserved as traceability metadata and are not used as unique keys.",
    indexRules: "Unified Indexing Rules",
    stateContext: "Global State Variables",
    conflictMatrix: "Source Index Conflict Matrix",
    screens: "Screens",
    lcdPreview: "LCD mockup",
    description: "Window description",
    purpose: "Purpose",
    meaning: "Information meaning",
    content: "Content",
    relation: "Relation to other windows",
    stateTable: "State table",
    transitions: "Transition routes",
    id: "ID",
    canonicalId: "Unified index",
    legacyWnd: "Legacy WND",
    mode: "Mode",
    kind: "Kind",
    status: "Status",
    integrity: "Source integrity",
    sourceIds: "Source Screen IDs",
    field: "Field",
    type: "Type/meaning",
    usage: "Source/usage",
    action: "Action/button",
    guard: "Guard",
    operation: "Operation",
    target: "Target screen",
    allModes: "All modes",
    allStatuses: "All statuses",
    search: "Search",
    details: "Details",
    close: "Close",
    routeList: "Route list",
    tree: "Mode tree",
    empty: "No data",
  },
};

const MODE_LABELS = {
  ru: { system: "Система", main: "Главное меню", photometry: "Фотометрия", quantitative: "Количественный анализ", kinetics: "Кинетика", multiWave: "Многоволновой анализ", settings: "Настройки", files: "Файлы", shared: "Общие окна" },
  en: { system: "System", main: "Main menu", photometry: "Photometry", quantitative: "Quantitative analysis", kinetics: "Kinetics", multiWave: "Multi-wavelength analysis", settings: "Settings", files: "Files", shared: "Shared screens" },
};

const KIND_LABELS = {
  ru: { menu: "Меню", input: "Ввод", measurement: "Измерение", graph: "График", dialog: "Диалог", file: "Файл", system: "Система" },
  en: { menu: "Menu", input: "Input", measurement: "Measurement", graph: "Graph", dialog: "Dialog", file: "File", system: "System" },
};

const TITLE_RU = {
  boot: "Приветственное окно", diagnostic: "Диагностика", warmup: "Прогрев", main: "Главное меню",
  photometry: "Фотометрия", photometryValue: "Выбор сигнала фотометрии", photometryGraph: "График фотометрии",
  fileRoot: "Группы файлов", fileList: "Список файлов", fileActionMenu: "Действия с файлом", saveDialog: "Сохранение файла", input: "Ввод данных",
  quantMain: "Количественный анализ", quantUnits: "Единицы измерения", quantCoef: "Коэффициенты", calibrationSetupStandards: "Новая градуировка: стандарты",
  calibrationSetupParallels: "Новая градуировка: параллели", calibrationPlan: "План градуировки", calibrationStep: "Шаг градуировки", calibrationJournal: "Журнал градуировки", calibrationGraph: "График градуировки",
  kineticsMenu: "Параметры кинетики", kineticsRun: "Измерение кинетики", kineticsGraph: "График кинетики",
  multiWaveMenu: "Многоволновой анализ", multiWaveSetup: "Настройка длин волн", multiWaveRun: "Многоволновое измерение", multiWaveJournal: "Журнал многоволновых измерений", multiWaveGraph: "График многоволнового анализа",
  settings: "Настройки", version: "Версия прибора", warning: "Предупреждение",
};

const TITLE_EN = {
  boot: "Welcome Window", diagnostic: "Diagnostics", warmup: "Warm-Up", main: "Main Menu",
  photometry: "Photometry", photometryValue: "Photometry Signal Selection", photometryGraph: "Photometry Graph",
  fileRoot: "File Groups", fileList: "File List", fileActionMenu: "File Actions", saveDialog: "Save File", input: "Data Input",
  quantMain: "Quantitative Analysis", quantUnits: "Measurement Units", quantCoef: "Coefficients", calibrationSetupStandards: "New Calibration: Standards",
  calibrationSetupParallels: "New Calibration: Replicates", calibrationPlan: "Calibration Measurement Plan", calibrationStep: "Calibration Step", calibrationJournal: "Calibration Journal", calibrationGraph: "Calibration Graph",
  kineticsMenu: "Kinetics Parameters", kineticsRun: "Kinetics Measurement", kineticsGraph: "Kinetics Graph",
  multiWaveMenu: "Multi-Wavelength Analysis", multiWaveSetup: "Wavelength Setup", multiWaveRun: "Multi-Wavelength Measurement", multiWaveJournal: "Multi-Wavelength Journal", multiWaveGraph: "Multi-Wavelength Graph",
  settings: "Settings", version: "Instrument Version", warning: "Warning",
};

function esc(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function createFixtures() {
  const base = initialDevice();
  const measuredPlan = buildCalibrationPlan(3, 2).map((step, index) => ({
    ...step,
    result: index < 4 ? { a: 0.123 + index * 0.111, t: 88 - index * 3.4, energy: 12340 + index * 321 } : null,
  }));
  const multiBase = { ...base, currentSample: "sampleA", multiWaveCount: 3, multiWaveParallelCount: 2, multiWaveWavelengths: [412.5, 540, 620.3, 700, 820] };
  const multiMeasurement = buildMultiWaveMeasurement(multiBase);

  return {
    boot: { ...base, screen: "boot" },
    diagnostic: { ...base, screen: "diagnostic", diagIndex: 3 },
    warmup: { ...base, screen: "warmup", warmupRemaining: 745 },
    main: { ...base, screen: "main", mainIndex: 3 },
    photometry: { ...base, screen: "photometry", currentSample: "sampleA", measurements: [{ index: 1, wavelength: 546.2, a: 0.184, t: 65.4, energy: 22110 }], lastComputedA: 0.184, lastComputedT: 65.4, lastEnergy: 22110 },
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

function matrixToInlineSvg(matrix) {
  const width = LCD_W * SCALE;
  const height = LCD_H * SCALE;
  const rects = [`<rect width="${width}" height="${height}" rx="6" fill="${LCD_BG}"/>`];
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) rects.push(`<rect x="${x * SCALE}" y="${y * SCALE}" width="${SCALE}" height="${SCALE}" fill="${LCD_FG}"/>`);
    });
  });
  return `<svg class="lcd-svg" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">${rects.join("")}</svg>`;
}

function sortScreens(screens) {
  return [...screens].sort((a, b) => {
    const modeDiff = MODE_ORDER.indexOf(a.mode) - MODE_ORDER.indexOf(b.mode);
    if (modeDiff) return modeDiff;
    return String(a.legacyWnd || a.canonicalId).localeCompare(String(b.legacyWnd || b.canonicalId), "en", { numeric: true });
  });
}

function titleFor(screen, lang) {
  return (lang === "ru" ? TITLE_RU : TITLE_EN)[screen.id] || screen.label || screen.id;
}

function fieldType(field, lang) {
  const ru = {
    index: "числовой индекс выбранного пункта",
    status: "строковый статус узла или проверки",
    wavelength: "число, длина волны в нм",
    graph: "массив точек для графика",
    measurement: "структура результата измерения",
    input: "строковый буфер ввода",
    return: "контекстный экран возврата",
    warning: "структура предупреждения",
    file: "контекст файлового менеджера",
    calibration: "состояние градуировки",
  };
  const en = {
    index: "numeric selected-item index",
    status: "string node or check status",
    wavelength: "number, wavelength in nm",
    graph: "array of graph points",
    measurement: "measurement result structure",
    input: "string input buffer",
    return: "contextual return screen",
    warning: "warning structure",
    file: "file-manager context",
    calibration: "calibration state",
  };
  const dictionary = lang === "ru" ? ru : en;
  const lower = field.toLowerCase();
  const key = Object.keys(dictionary).find((item) => lower.includes(item));
  return dictionary[key] || (lang === "ru" ? "значение состояния или LCD-плейсхолдер" : "state value or LCD placeholder");
}

function describeScreen(screen, knownTargets, lang) {
  const title = titleFor(screen, lang);
  const mode = MODE_LABELS[lang][screen.mode] || screen.mode;
  const kind = KIND_LABELS[lang][screen.kind] || screen.kind;
  const fields = screen.fields?.length ? screen.fields.join(", ") : (lang === "ru" ? "без выделенных динамических полей" : "no dedicated dynamic fields");
  const targets = knownTargets.length ? knownTargets.join(", ") : (lang === "ru" ? "нет исходящих переходов" : "no outgoing transitions");

  if (lang === "ru") {
    return {
      purpose: `${title} используется как ${kind.toLowerCase()} в группе "${mode}".`,
      meaning: `Окно фиксирует состояние сценария "${mode}" и связывает runtime id "${screen.id}" с единым индексом ${screen.canonicalId}.`,
      content: `LCD-наполнение формируется из полей: ${fields}.`,
      relation: `Переходы из окна ведут к: ${targets}.`,
    };
  }
  return {
    purpose: `${title} is used as a ${kind.toLowerCase()} in the "${mode}" group.`,
    meaning: `The window captures the "${mode}" scenario state and links runtime id "${screen.id}" to unified index ${screen.canonicalId}.`,
    content: `LCD content is assembled from fields: ${fields}.`,
    relation: `Outgoing routes lead to: ${targets}.`,
  };
}

function buildScreenData(screen, registryById, fixtures, lang) {
  const device = fixtures[screen.id] || { ...initialDevice(), screen: screen.id };
  let lcdRows = [];
  let lcdSvg = "";
  try {
    lcdRows = getLcdRows(device);
    lcdSvg = matrixToInlineSvg(renderDeviceToMatrix(device));
  } catch (error) {
    lcdRows = [lang === "ru" ? "LCD-превью недоступно" : "LCD preview unavailable", String(error.message || error)];
    lcdSvg = `<div class="lcd-fallback">${esc(lcdRows.join("\n"))}</div>`;
  }

  const transitions = (screen.transitions || []).map((transition) => {
    const targetMeta = registryById.get(transition.target);
    return {
      action: transition.action || "",
      condition: transition.condition || "",
      operation: transition.source || transition.operation || "",
      target: transition.target || "",
      targetTitle: targetMeta ? titleFor(targetMeta, lang) : "",
      targetKnown: Boolean(targetMeta) || CONTEXT_TARGETS.has(transition.target),
    };
  });
  const knownTargets = transitions.map((transition) => transition.target).filter(Boolean);

  return {
    id: screen.id,
    canonicalId: screen.canonicalId,
    legacyWnd: screen.legacyWnd || "",
    title: titleFor(screen, lang),
    mode: screen.mode,
    modeLabel: MODE_LABELS[lang][screen.mode] || screen.mode,
    kind: screen.kind,
    kindLabel: KIND_LABELS[lang][screen.kind] || screen.kind,
    implementationStatus: screen.implementationStatus || "unknown",
    sourceIntegrity: screen.sourceIntegrity || "unknown",
    sourceScreenIds: screen.sourceScreenIds || [],
    sources: screen.sources || [],
    fields: screen.fields || [],
    stateRows: (screen.fields?.length ? screen.fields : ["state.screen"]).map((field) => ({
      field,
      type: fieldType(field, lang),
      usage: lang === "ru" ? `Используется LCD-рендерером или обработчиками экрана "${screen.id}".` : `Used by LCD renderer or handlers for screen "${screen.id}".`,
    })),
    transitions,
    lcdRows,
    lcdSvg,
    description: describeScreen(screen, knownTargets, lang),
  };
}

function duplicateSourceIds(screens) {
  const seen = new Map();
  for (const screen of screens) {
    for (const sourceId of screen.sourceScreenIds || []) {
      if (!seen.has(sourceId)) seen.set(sourceId, []);
      seen.get(sourceId).push(screen.id);
    }
  }
  return [...seen.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([sourceId, ids]) => ({ sourceId, canonicalScreens: ids }));
}

function buildDocumentData(screens, lang) {
  const registryById = new Map(screens.map((screen) => [screen.id, screen]));
  const fixtures = createFixtures();
  const sorted = sortScreens(screens);
  const screenData = sorted.map((screen) => buildScreenData(screen, registryById, fixtures, lang));
  return {
    language: lang,
    generatedAt: new Date().toISOString(),
    labels: LABELS[lang],
    modes: MODE_ORDER.map((mode) => ({ id: mode, label: MODE_LABELS[lang][mode] || mode })),
    screens: screenData,
    conflicts: duplicateSourceIds(screens),
    globalState: [
      ["state.screen", lang === "ru" ? "runtime id активного окна" : "runtime id of the active window"],
      ["inputTarget", lang === "ru" ? "цель текущего ввода" : "current input target"],
      ["returnScreen", lang === "ru" ? "экран возврата после диалога" : "return screen after a dialog"],
      ["warningReturn", lang === "ru" ? "экран возврата после предупреждения" : "return screen after a warning"],
      ["previousScreen", lang === "ru" ? "предыдущий экран в маршруте" : "previous screen in the route"],
      ["saveMeta.group", lang === "ru" ? "группа сохраняемого файла" : "saved file group"],
      ["fileContext.group", lang === "ru" ? "активная группа файлового менеджера" : "active file-manager group"],
    ],
  };
}

function commonCss() {
  return `
    :root { color-scheme: light; --bg: #f4f6f7; --paper: #ffffff; --ink: #1d2528; --muted: #617077; --line: #cfd8dc; --accent: #0d6b68; --accent-2: #253b53; --lcd-bg: ${LCD_BG}; --lcd-fg: ${LCD_FG}; }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--ink); font-family: Arial, "Noto Sans", sans-serif; line-height: 1.45; }
    h1, h2, h3 { margin: 0 0 12px; line-height: 1.2; }
    h1 { font-size: 34px; }
    h2 { font-size: 24px; border-bottom: 2px solid var(--accent); padding-bottom: 8px; margin-top: 28px; }
    h3 { font-size: 17px; color: var(--accent-2); }
    p { margin: 0 0 10px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0 18px; font-size: 12px; }
    th, td { border: 1px solid var(--line); padding: 7px 8px; vertical-align: top; }
    th { background: #e9eff1; text-align: left; }
    .badge { display: inline-block; border: 1px solid var(--line); border-radius: 7px; padding: 2px 7px; background: #eef4f4; font-size: 11px; margin: 2px 3px 2px 0; }
    .lcd-wrap { background: #1b2326; border-radius: 8px; padding: 10px; display: inline-block; max-width: 100%; }
    .lcd-svg { width: ${LCD_W * SCALE}px; max-width: 100%; height: auto; image-rendering: pixelated; display: block; }
    .lcd-rows { white-space: pre-wrap; font: 11px/1.35 Consolas, "Courier New", monospace; background: #f7fafb; border: 1px solid var(--line); border-radius: 7px; padding: 8px; margin-top: 8px; }
    .lcd-fallback { white-space: pre-wrap; color: #b5f3da; font: 12px/1.35 Consolas, monospace; min-width: 300px; min-height: 120px; }
    .screen-section { break-inside: avoid; page-break-inside: avoid; background: var(--paper); border: 1px solid var(--line); border-radius: 8px; padding: 18px; margin: 18px 0; }
    .meta-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin: 12px 0; }
    .meta { border: 1px solid var(--line); border-radius: 7px; padding: 7px; background: #fbfcfc; }
    .meta strong { display: block; font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
    .two-col { display: grid; grid-template-columns: 380px 1fr; gap: 18px; align-items: start; }
    .cover { min-height: 720px; display: flex; flex-direction: column; justify-content: center; }
    .note { border-left: 4px solid var(--accent); padding: 10px 12px; background: #ecf4f3; }
    @media print { body { background: #fff; } .screen-section { border-color: #b9c5c9; } .no-print { display: none !important; } }
    @media (max-width: 820px) { .two-col, .meta-grid { grid-template-columns: 1fr; } h1 { font-size: 28px; } }
  `;
}

function renderSpecHtml(data) {
  const l = data.labels;
  const screenIndexRows = data.screens.map((screen) => `
    <tr><td>${esc(screen.canonicalId)}</td><td>${esc(screen.id)}</td><td>${esc(screen.legacyWnd)}</td><td>${esc(screen.title)}</td><td>${esc(screen.modeLabel)}</td><td>${esc(screen.kindLabel)}</td></tr>
  `).join("");

  const sections = data.screens.map((screen) => `
    <section class="screen-section" id="${esc(screen.id)}">
      <h2>${esc(screen.canonicalId)} · ${esc(screen.title)}</h2>
      <div class="meta-grid">
        <div class="meta"><strong>${l.id}</strong>${esc(screen.id)}</div>
        <div class="meta"><strong>${l.legacyWnd}</strong>${esc(screen.legacyWnd)}</div>
        <div class="meta"><strong>${l.mode}</strong>${esc(screen.modeLabel)}</div>
        <div class="meta"><strong>${l.status}</strong>${esc(screen.implementationStatus)}</div>
      </div>
      <div class="two-col">
        <div>
          <h3>${l.lcdPreview}</h3>
          <div class="lcd-wrap">${screen.lcdSvg}</div>
          <div class="lcd-rows">${esc(screen.lcdRows.join("\n"))}</div>
        </div>
        <div>
          <h3>${l.description}</h3>
          <p><strong>${l.purpose}:</strong> ${esc(screen.description.purpose)}</p>
          <p><strong>${l.meaning}:</strong> ${esc(screen.description.meaning)}</p>
          <p><strong>${l.content}:</strong> ${esc(screen.description.content)}</p>
          <p><strong>${l.relation}:</strong> ${esc(screen.description.relation)}</p>
          <p><strong>${l.sourceIds}:</strong> ${screen.sourceScreenIds.map((id) => `<span class="badge">${esc(id)}</span>`).join("") || esc(l.empty)}</p>
          <p><strong>${l.integrity}:</strong> ${esc(screen.sourceIntegrity)}</p>
        </div>
      </div>
      <h3>${l.stateTable}</h3>
      <table><thead><tr><th>${l.field}</th><th>${l.type}</th><th>${l.usage}</th></tr></thead><tbody>
        ${screen.stateRows.map((row) => `<tr><td><code>${esc(row.field)}</code></td><td>${esc(row.type)}</td><td>${esc(row.usage)}</td></tr>`).join("")}
      </tbody></table>
      <h3>${l.transitions}</h3>
      <table><thead><tr><th>${l.action}</th><th>${l.guard}</th><th>${l.operation}</th><th>${l.target}</th></tr></thead><tbody>
        ${screen.transitions.length ? screen.transitions.map((route) => `<tr><td>${esc(route.action)}</td><td>${esc(route.condition || "—")}</td><td>${esc(route.operation || "—")}</td><td>${esc(route.target)}${route.targetTitle ? ` · ${esc(route.targetTitle)}` : ""}</td></tr>`).join("") : `<tr><td colspan="4">${esc(l.empty)}</td></tr>`}
      </tbody></table>
    </section>
  `).join("");

  const conflicts = data.conflicts.length
    ? data.conflicts.map((item) => `<tr><td>${esc(item.sourceId)}</td><td>${item.canonicalScreens.map(esc).join(", ")}</td></tr>`).join("")
    : `<tr><td colspan="2">${esc(data.language === "ru" ? "Коллизии не обнаружены" : "No collisions detected")}</td></tr>`;

  return `<!doctype html>
<html lang="${data.language}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(l.docTitle)}</title>
  <style>${commonCss()}</style>
</head>
<body>
  <main style="max-width: 1080px; margin: 0 auto; padding: 32px;">
    <section class="cover">
      <h1>${esc(l.docTitle)}</h1>
      <p><strong>${l.version}:</strong> 1.0</p>
      <p><strong>${l.date}:</strong> ${new Date().toISOString().slice(0, 10)}</p>
      <p class="note"><strong>${l.source}:</strong> ${esc(l.sourceNote)}</p>
    </section>
    <section>
      <h2>${esc(l.indexRules)}</h2>
      <table><thead><tr><th>${l.canonicalId}</th><th>runtime id</th><th>${l.legacyWnd}</th><th>${data.language === "ru" ? "Название" : "Title"}</th><th>${l.mode}</th><th>${l.kind}</th></tr></thead><tbody>${screenIndexRows}</tbody></table>
    </section>
    <section>
      <h2>${esc(l.stateContext)}</h2>
      <table><thead><tr><th>${l.field}</th><th>${l.usage}</th></tr></thead><tbody>${data.globalState.map(([key, meaning]) => `<tr><td><code>${esc(key)}</code></td><td>${esc(meaning)}</td></tr>`).join("")}</tbody></table>
    </section>
    <section>
      <h2>${esc(l.screens)}</h2>
      ${sections}
    </section>
    <section>
      <h2>${esc(l.conflictMatrix)}</h2>
      <table><thead><tr><th>Screen ID</th><th>canonical runtime ids</th></tr></thead><tbody>${conflicts}</tbody></table>
    </section>
  </main>
</body>
</html>`;
}

function renderMapHtml(data) {
  const l = data.labels;
  const payload = JSON.stringify({ screens: data.screens, modes: data.modes, labels: l });
  return `<!doctype html>
<html lang="${data.language}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(l.mapTitle)}</title>
  <style>
    ${commonCss()}
    :root[data-theme="dark"] { color-scheme: dark; --bg: #111719; --paper: #192225; --ink: #edf4f4; --muted: #9fb0b6; --line: #35454b; --accent: #6fc7bd; --accent-2: #c6dcff; }
    body { min-height: 100vh; }
    .app { display: grid; grid-template-columns: 300px 1fr; min-height: 100vh; }
    aside { position: sticky; top: 0; height: 100vh; overflow: auto; background: var(--paper); border-right: 1px solid var(--line); padding: 18px; }
    .toolbar { display: grid; gap: 10px; margin: 18px 0; }
    input, select, button { width: 100%; border: 1px solid var(--line); border-radius: 7px; padding: 9px 10px; background: var(--paper); color: var(--ink); }
    button { cursor: pointer; background: var(--accent); color: #fff; border-color: var(--accent); }
    .content { padding: 22px; }
    .mode-block { margin-bottom: 26px; }
    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
    .card { background: var(--paper); border: 1px solid var(--line); border-radius: 8px; padding: 13px; cursor: pointer; }
    .card:hover { border-color: var(--accent); }
    .card h3 { margin-bottom: 6px; }
    .mini-meta { color: var(--muted); font-size: 12px; margin-bottom: 10px; }
    .routes { font-size: 12px; color: var(--muted); margin-top: 8px; }
    .tree-item { border-left: 3px solid var(--accent); padding: 5px 0 5px 10px; margin: 5px 0; font-size: 13px; }
    dialog { width: min(980px, 92vw); border: 1px solid var(--line); border-radius: 8px; padding: 0; background: var(--paper); color: var(--ink); }
    dialog::backdrop { background: rgba(0,0,0,.55); }
    .modal-head { display: flex; justify-content: space-between; gap: 12px; align-items: center; padding: 14px 16px; border-bottom: 1px solid var(--line); }
    .modal-body { padding: 16px; }
    @media (max-width: 900px) { .app { grid-template-columns: 1fr; } aside { position: static; height: auto; } }
  </style>
</head>
<body>
  <div class="app">
    <aside>
      <h1 style="font-size: 22px;">${esc(l.mapTitle)}</h1>
      <div class="toolbar">
        <input id="search" placeholder="${esc(l.search)}" />
        <select id="mode"><option value="">${esc(l.allModes)}</option></select>
        <select id="status"><option value="">${esc(l.allStatuses)}</option></select>
        <button id="theme">Theme</button>
      </div>
      <h3>${esc(l.tree)}</h3>
      <div id="tree"></div>
    </aside>
    <main class="content">
      <div id="cards"></div>
      <h2>${esc(l.routeList)}</h2>
      <div id="routes"></div>
    </main>
  </div>
  <dialog id="modal"><div class="modal-head"><h2 id="modal-title"></h2><button id="modal-close" style="width:auto;">${esc(l.close)}</button></div><div class="modal-body" id="modal-body"></div></dialog>
  <script>
    const DATA = ${payload};
    const root = document.documentElement;
    const modeSelect = document.getElementById("mode");
    const statusSelect = document.getElementById("status");
    const searchInput = document.getElementById("search");
    const cardsEl = document.getElementById("cards");
    const routesEl = document.getElementById("routes");
    const treeEl = document.getElementById("tree");
    const modal = document.getElementById("modal");
    const modalTitle = document.getElementById("modal-title");
    const modalBody = document.getElementById("modal-body");
    const escHtml = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    const unique = (items) => [...new Set(items.filter(Boolean))];
    DATA.modes.forEach((mode) => modeSelect.insertAdjacentHTML("beforeend", \`<option value="\${mode.id}">\${escHtml(mode.label)}</option>\`));
    unique(DATA.screens.map((screen) => screen.implementationStatus)).forEach((status) => statusSelect.insertAdjacentHTML("beforeend", \`<option value="\${status}">\${escHtml(status)}</option>\`));
    document.getElementById("theme").addEventListener("click", () => root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark");
    document.getElementById("modal-close").addEventListener("click", () => modal.close());
    [modeSelect, statusSelect, searchInput].forEach((node) => node.addEventListener("input", render));
    function filteredScreens() {
      const query = searchInput.value.trim().toLowerCase();
      return DATA.screens.filter((screen) => {
        const matchesMode = !modeSelect.value || screen.mode === modeSelect.value;
        const matchesStatus = !statusSelect.value || screen.implementationStatus === statusSelect.value;
        const haystack = [screen.id, screen.canonicalId, screen.legacyWnd, screen.title, screen.modeLabel, ...screen.sourceScreenIds].join(" ").toLowerCase();
        return matchesMode && matchesStatus && (!query || haystack.includes(query));
      });
    }
    function openScreen(id) {
      const screen = DATA.screens.find((item) => item.id === id);
      modalTitle.textContent = \`\${screen.canonicalId} · \${screen.title}\`;
      modalBody.innerHTML = \`
        <div class="two-col"><div><div class="lcd-wrap">\${screen.lcdSvg}</div><div class="lcd-rows">\${escHtml(screen.lcdRows.join("\\n"))}</div></div>
        <div><p><strong>\${DATA.labels.purpose}:</strong> \${escHtml(screen.description.purpose)}</p><p><strong>\${DATA.labels.meaning}:</strong> \${escHtml(screen.description.meaning)}</p><p><strong>\${DATA.labels.content}:</strong> \${escHtml(screen.description.content)}</p><p><strong>\${DATA.labels.relation}:</strong> \${escHtml(screen.description.relation)}</p></div></div>
        <h3>\${DATA.labels.stateTable}</h3><table><thead><tr><th>\${DATA.labels.field}</th><th>\${DATA.labels.type}</th><th>\${DATA.labels.usage}</th></tr></thead><tbody>\${screen.stateRows.map((row) => \`<tr><td><code>\${escHtml(row.field)}</code></td><td>\${escHtml(row.type)}</td><td>\${escHtml(row.usage)}</td></tr>\`).join("")}</tbody></table>
        <h3>\${DATA.labels.transitions}</h3><table><thead><tr><th>\${DATA.labels.action}</th><th>\${DATA.labels.guard}</th><th>\${DATA.labels.operation}</th><th>\${DATA.labels.target}</th></tr></thead><tbody>\${screen.transitions.map((route) => \`<tr><td>\${escHtml(route.action)}</td><td>\${escHtml(route.condition || "—")}</td><td>\${escHtml(route.operation || "—")}</td><td>\${escHtml(route.target)} \${route.targetTitle ? "· " + escHtml(route.targetTitle) : ""}</td></tr>\`).join("") || \`<tr><td colspan="4">\${DATA.labels.empty}</td></tr>\`}</tbody></table>\`;
      modal.showModal();
    }
    function render() {
      const screens = filteredScreens();
      treeEl.innerHTML = DATA.modes.map((mode) => {
        const count = screens.filter((screen) => screen.mode === mode.id).length;
        return \`<div class="tree-item">\${escHtml(mode.label)}: \${count}</div>\`;
      }).join("");
      cardsEl.innerHTML = DATA.modes.map((mode) => {
        const group = screens.filter((screen) => screen.mode === mode.id);
        if (!group.length) return "";
        return \`<section class="mode-block"><h2>\${escHtml(mode.label)}</h2><div class="cards">\${group.map((screen) => \`
          <article class="card" data-id="\${escHtml(screen.id)}"><h3>\${escHtml(screen.canonicalId)} · \${escHtml(screen.title)}</h3><div class="mini-meta">\${escHtml(screen.id)} · \${escHtml(screen.legacyWnd)} · \${escHtml(screen.kindLabel)} · \${escHtml(screen.implementationStatus)}</div><div class="lcd-wrap">\${screen.lcdSvg}</div><div class="routes">\${screen.transitions.map((route) => escHtml(route.action + " -> " + route.target)).join("<br>") || DATA.labels.empty}</div></article>\`).join("")}</div></section>\`;
      }).join("");
      cardsEl.querySelectorAll(".card").forEach((card) => card.addEventListener("click", () => openScreen(card.dataset.id)));
      routesEl.innerHTML = \`<table><thead><tr><th>from</th><th>\${DATA.labels.action}</th><th>\${DATA.labels.guard}</th><th>\${DATA.labels.target}</th></tr></thead><tbody>\${screens.flatMap((screen) => screen.transitions.map((route) => \`<tr><td>\${escHtml(screen.id)}</td><td>\${escHtml(route.action)}</td><td>\${escHtml(route.condition || "—")}</td><td>\${escHtml(route.target)}</td></tr>\`)).join("") || \`<tr><td colspan="4">\${DATA.labels.empty}</td></tr>\`}</tbody></table>\`;
    }
    render();
  </script>
</body>
</html>`;
}

async function readRegistry() {
  const raw = await fs.readFile(REGISTRY_PATH, "utf8");
  const screens = JSON.parse(raw);
  if (!Array.isArray(screens) || screens.length === 0) {
    throw new Error("screens.json must contain a non-empty array");
  }
  const ids = new Set();
  for (const screen of screens) {
    if (!screen.id || ids.has(screen.id)) throw new Error(`Invalid or duplicated screen id: ${screen.id}`);
    ids.add(screen.id);
    if (!screen.canonicalId) throw new Error(`Screen ${screen.id} has no canonicalId`);
  }
  return screens;
}

async function writeText(filepath, content) {
  await fs.mkdir(path.dirname(filepath), { recursive: true });
  await fs.writeFile(filepath, content, "utf8");
}

async function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (path.isAbsolute(candidate) && await fileExists(candidate)) return candidate;
  }
  return "";
}

async function fileExists(filepath) {
  try {
    const stat = await fs.stat(filepath);
    return stat.isFile() && stat.size > 0;
  } catch {
    return false;
  }
}

async function printPdf(htmlPath, pdfPath) {
  const browser = await findBrowser();
  if (!browser) {
    throw new Error("Chrome or Edge executable was not found for PDF generation");
  }
  const userDataDir = path.join(ROOT, "artifacts", "chrome-docs-profile");
  await fs.mkdir(userDataDir, { recursive: true });
  const result = spawnSync(browser, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    `--user-data-dir=${userDataDir}`,
    `--print-to-pdf=${pdfPath}`,
    "--no-pdf-header-footer",
    pathToFileURL(htmlPath).href,
  ], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`PDF generation failed for ${path.basename(htmlPath)}: ${result.stderr || result.stdout}`);
  }
  if (!(await fileExists(pdfPath))) {
    throw new Error(`PDF was not created: ${pdfPath}`);
  }
}

async function assertOutputs(files) {
  const missing = [];
  for (const filepath of files) {
    if (!(await fileExists(filepath))) missing.push(filepath);
  }
  if (missing.length) {
    throw new Error(`Generated files are missing or empty:\n${missing.join("\n")}`);
  }
}

async function main() {
  const screens = await readRegistry();
  const dataByLang = {
    ru: buildDocumentData(screens, "ru"),
    en: buildDocumentData(screens, "en"),
  };
  if (dataByLang.ru.screens.length !== dataByLang.en.screens.length) {
    throw new Error("RU/EN generated screen counts do not match");
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.mkdir(GENERATED_DIR, { recursive: true });

  const generatedFiles = [];
  for (const lang of ["ru", "en"]) {
    const data = dataByLang[lang];
    const specHtmlPath = path.join(OUT_DIR, OUTPUTS[lang].specHtml);
    const mapHtmlPath = path.join(OUT_DIR, OUTPUTS[lang].mapHtml);
    const dataPath = path.join(GENERATED_DIR, OUTPUTS[lang].data);

    await writeText(dataPath, JSON.stringify(data, null, 2));
    await writeText(specHtmlPath, renderSpecHtml(data));
    await writeText(mapHtmlPath, renderMapHtml(data));
    generatedFiles.push(dataPath, specHtmlPath, mapHtmlPath);

    if (!HTML_ONLY) {
      const pdfPath = path.join(OUT_DIR, OUTPUTS[lang].specPdf);
      await printPdf(specHtmlPath, pdfPath);
      generatedFiles.push(pdfPath);
    }
  }

  await assertOutputs(generatedFiles);
  console.log(`Generated ${dataByLang.ru.screens.length} screens per language.`);
  generatedFiles.forEach((filepath) => console.log(path.relative(ROOT, filepath)));
}

await main();
