import {
  DARK_VALUES,
  FILE_EXTENSIONS,
  MULTIWAVE_COUNT_MAX,
  MULTIWAVE_COUNT_MIN,
  VALID_FILE_RE,
  WL_MAX,
  WL_MIN,
  WARMUP_DURATION_SEC,
} from "../constants/index.js";
import { clamp, formatMmSs } from "./utils.js";

const QUANT_CUVETTE_MIN_MM = 1;
const QUANT_CUVETTE_MAX_MM = 100;

const DIAGNOSTIC_STEP_LABELS = [
  "Фильтр",
  "Лампа",
  "Детектор",
  "D2-лампа",
  "W-лампа",
  "Калибр. λ",
  "Темн. ток",
];

export function createDiagnosticSteps() {
  return DIAGNOSTIC_STEP_LABELS.map((label, index) => ({
    id: `diagnostic-${index + 1}`,
    label,
    status: index === 0 ? "running" : "pending",
  }));
}

export function referenceEnergyAt(wl) {
  const trend = 33880 - Math.abs(wl - 540) * 4.2;
  const ripple = 320 * Math.sin(wl / 46) + 120 * Math.cos(wl / 23);
  return Math.round(clamp(trend + ripple, 12000, 60000));
}

export function absorbanceForSample(sample, wl, t = 0) {
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
    let absorbance = 0.04;
    for (const peak of peaks) {
      absorbance += 0.9 * Math.exp(-((wl - peak) ** 2) / (2 * 2.2 ** 2));
    }
    return clamp(absorbance, 0, 3.4);
  }

  if (sample === "kinetic") {
    const baseline = 0.08 + 0.04 * Math.exp(-((wl - 546) ** 2) / (2 * 30 ** 2));
    const rise = 0.75 * (1 - Math.exp(-t / 18));
    return clamp(baseline + rise, 0, 2.5);
  }

  return 0.2;
}

export function addNoise(base, amplitude = 12) {
  return Math.round(base + (Math.random() - 0.5) * amplitude * 2);
}

export function measureSample({ sample, wavelength, gain, e100, darkValues, timeSec = 0 }) {
  const dark = darkValues[gain - 1] ?? darkValues[0];
  const ref = referenceEnergyAt(wavelength);
  const absorbance = absorbanceForSample(sample, wavelength, timeSec);
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

export function measureMultiwaveSeries(state) {
  const count = clamp(state.multiwave?.waveCount ?? MULTIWAVE_COUNT_MIN, MULTIWAVE_COUNT_MIN, MULTIWAVE_COUNT_MAX);
  const wavelengths = state.multiwave?.wavelengths ?? [];

  return wavelengths.slice(0, count).map((wavelength, index) => {
    const measurement = measureSample({
      sample: state.currentSample,
      wavelength,
      gain: state.gain,
      e100: state.e100,
      darkValues: state.darkValues,
    });

    return {
      index: index + 1,
      wavelength,
      energy: measurement.energy,
      a: measurement.a,
      t: measurement.t,
    };
  });
}

export function fileExtByGroup(group) {
  return FILE_EXTENSIONS[group] || ".kin";
}

export function seedFiles() {
  return {
    ФОТОМЕТРИЯ: [
      { name: "BLANK_540", ext: ".qua", exported: false },
      { name: "HOLMIUM_TEST", ext: ".qua", exported: true },
    ],
    ГРАДУИРОВКА: [{ name: "FE_SERIES_V1", ext: ".std", exported: false }],
    КОЭФФИЦИЕНТ: [{ name: "PROTEIN_KB", ext: ".cof", exported: false }],
    КИНЕТИКА: [{ name: "REACTION_A", ext: ".kin", exported: false }],
    МНОГОВОЛНОВЫЙ: [{ name: "WAVE_SCAN_220_260", ext: ".mwl", exported: false }],
  };
}

export function buildCalibrationPlan(standards, parallels) {
  const plan = [];
  for (let parallel = 1; parallel <= parallels; parallel += 1) {
    for (let standard = 1; standard <= standards; standard += 1) {
      plan.push({
        id: `${standard}-${parallel}`,
        code: `С-${standard}-${parallel}`,
        standardIndex: standard,
        parallelIndex: parallel,
        status: "pending",
        result: null,
      });
    }
  }
  return plan;
}

export function getCalibrationDoneCount(plan) {
  return plan.filter((step) => Boolean(step.result)).length;
}

export function getCalibrationResultIndexes(plan) {
  return plan
    .map((step, idx) => ({ step, idx }))
    .filter(({ step }) => Boolean(step.result))
    .map(({ idx }) => idx);
}

export function findNextPendingStep(plan, fromIndex = -1) {
  for (let index = fromIndex + 1; index < plan.length; index += 1) {
    if (!plan[index].result) return index;
  }
  return -1;
}

export function findPrevMeasuredIndex(plan, fromIndex) {
  for (let index = fromIndex - 1; index >= 0; index -= 1) {
    if (plan[index]?.result) return index;
  }
  return fromIndex;
}

export function findNextMeasuredIndex(plan, fromIndex) {
  for (let index = fromIndex + 1; index < plan.length; index += 1) {
    if (plan[index]?.result) return index;
  }
  return -1;
}

export function buildUsbExportPreview({
  group,
  name,
  ext,
  measurements = [],
  calibrationPlan = [],
  kineticPoints = [],
  multiwaveResults = [],
  wavelength,
  quantK,
  quantB,
  lastA,
  cuvetteLengthMm,
}) {
  const lines = ["USB_DEVICE=USB1", `GROUP=${group}`, `FILE=${name}${ext}`, "EXPORT_FORMAT=csv", "---"];

  if (group === "ФОТОМЕТРИЯ") {
    lines.push("index,wavelength_nm,energy,A,T_percent");
    const rows = measurements.slice(-10);
    if (!rows.length) {
      lines.push(`1,${wavelength.toFixed(1)},,,`);
    } else {
      rows.forEach((measurement) => {
        lines.push(
          `${measurement.index},${measurement.wavelength.toFixed(1)},${measurement.energy},${measurement.a.toFixed(4)},${measurement.t.toFixed(2)}`,
        );
      });
    }
    return lines.join("\n");
  }

  if (group === "ГРАДУИРОВКА") {
    lines.push("code,standard_index,parallel_index,A,T_percent,energy");
    const rows = calibrationPlan.filter((step) => step.result);
    if (!rows.length) {
      lines.push("С-1-1,1,1,,,");
    } else {
      rows.forEach((step) => {
        lines.push(
          `${step.code},${step.standardIndex},${step.parallelIndex},${step.result.a.toFixed(4)},${step.result.t.toFixed(2)},${step.result.energy}`,
        );
      });
    }
    return lines.join("\n");
  }

  if (group === "КОЭФФИЦИЕНТ") {
    const result = quantK * lastA + quantB;
    lines.push("wavelength_nm,K,B,A,result,cuvette_length_mm");
    lines.push(
      `${wavelength.toFixed(1)},${quantK.toFixed(6)},${quantB.toFixed(6)},${lastA.toFixed(6)},${result.toFixed(6)},${cuvetteLengthMm ?? 10}`,
    );
    return lines.join("\n");
  }

  if (group === "МНОГОВОЛНОВЫЙ") {
    lines.push("index,wavelength_nm,energy,A,T_percent");
    if (!multiwaveResults.length) {
      lines.push("1,,,,");
    } else {
      multiwaveResults.forEach((item) => {
        lines.push(`${item.index},${item.wavelength.toFixed(1)},${item.energy},${item.a.toFixed(4)},${item.t.toFixed(2)}`);
      });
    }
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

export function initialDevice() {
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
    company: "МЕТАШ",
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
    cuvetteLengthMm: 10,
    multiwave: {
      waveCount: 2,
      wavelengths: [220.0, 260.0, null, null],
      valueIndex: 0,
      results: [],
      editIndex: 0,
    },
    e100: 33869,
    lastEnergy: 33869,
    lastComputedA: 0,
    lastComputedT: 100,
    emulatorPaused: false,
    darkValues: [...DARK_VALUES],
    busy: false,
    busyLabel: "ПОДОЖДИТЕ",
    diagIndex: 0,
    diagnosticSteps: createDiagnosticSteps(),
    warmupRemaining: WARMUP_DURATION_SEC,
    currentSample: "reference",
    logLines: ["2026-03-24T16:20:17.662 - connect", "2026-03-24T16:20:26.365 - ok."],
    fileRootIndex: 0,
    fileListIndex: 0,
    fileActionIndex: 0,
    fileContext: { mode: "browse", group: "ФОТОМЕТРИЯ" },
    files: seedFiles(),
    saveMeta: { group: "ФОТОМЕТРИЯ", suggestedExt: ".qua" },
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

export function validateFileName(name) {
  const trimmed = String(name ?? "").trim().toUpperCase();
  if (!trimmed) return { valid: false, error: "ПУСТОЕ ИМЯ" };
  if (trimmed.length > 18) return { valid: false, error: "ИМЯ ДЛИННОЕ" };
  if (!VALID_FILE_RE.test(trimmed)) return { valid: false, error: "НЕДОПУСТИМЫЕ СИМВ." };
  return { valid: true, value: trimmed };
}

export function validateWavelength(wl) {
  const parsed = typeof wl === "string" ? parseFloat(wl) : wl;
  if (Number.isNaN(parsed)) {
    return { valid: false, error: "НЕВЕРНАЯ ДЛИНА ВОЛНЫ" };
  }
  if (parsed < WL_MIN || parsed > WL_MAX) {
    return { valid: false, error: `ДЛИНА ВОЛНЫ ${WL_MIN}-${WL_MAX} НМ` };
  }
  return { valid: true, value: clamp(parsed, WL_MIN, WL_MAX) };
}

export function validateMultiwaveCount(value) {
  const parsed = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(parsed)) {
    return { valid: false, error: "НЕВЕРНОЕ ЧИСЛО λ" };
  }

  const rounded = Math.round(parsed);
  if (rounded < MULTIWAVE_COUNT_MIN || rounded > MULTIWAVE_COUNT_MAX) {
    return { valid: false, error: `ЧИСЛО λ ${MULTIWAVE_COUNT_MIN}-${MULTIWAVE_COUNT_MAX}` };
  }

  return { valid: true, value: rounded };
}

export function validateMultiwaveWavelength(value) {
  const validation = validateWavelength(value);
  if (!validation.valid) return validation;
  return { valid: true, value: Math.round(validation.value * 10) / 10 };
}

export function validateNumeric(value, min, max, fieldName = "ЗНАЧЕНИЕ") {
  const parsed = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(parsed)) {
    return { valid: false, error: `НЕВЕРНЫЙ ${String(fieldName).toUpperCase()}` };
  }
  return { valid: true, value: clamp(parsed, min, max) };
}

export function validateQuantCuvetteLengthMm(value) {
  const validation = validateNumeric(value, QUANT_CUVETTE_MIN_MM, QUANT_CUVETTE_MAX_MM, "ДЛИНА КЮВЕТЫ");
  if (!validation.valid) return validation;
  return { valid: true, value: Math.round(validation.value * 10) / 10 };
}

function assertDev(condition, message) {
  if (!condition) throw new Error(`Self-test failed: ${message}`);
}

export function runSelfTests() {
  const plan = buildCalibrationPlan(3, 2);
  assertDev(plan.length === 6, "plan length should equal standards * parallels");
  assertDev(plan[0].code === "С-1-1", "first plan code should be С-1-1");
  assertDev(plan[5].code === "С-3-2", "last plan code should be С-3-2");
  assertDev(fileExtByGroup("ФОТОМЕТРИЯ") === ".qua", "photometry extension mismatch");
  assertDev(fileExtByGroup("ГРАДУИРОВКА") === ".std", "calibration extension mismatch");
  assertDev(fileExtByGroup("МНОГОВОЛНОВЫЙ") === ".mwl", "multiwave extension mismatch");
  assertDev(validateMultiwaveCount(2).valid, "multiwave min count should be valid");
  assertDev(validateMultiwaveWavelength(220).valid, "multiwave wavelength should be valid");
  assertDev(validateQuantCuvetteLengthMm(10).valid, "cuvette length should be valid");
  assertDev(clamp(15, 1, 9) === 9, "clamp upper bound mismatch");
  assertDev(clamp(-1, 1, 9) === 1, "clamp lower bound mismatch");
}

export { clamp, formatMmSs };
