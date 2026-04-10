export const SCREEN_INDEX = {
  boot: "WND-01",
  diagnostic: "WND-02",
  warmup: "WND-03",
  main: "WND-04",
  photometry: "WND-05",
  photometryValue: "WND-06",
  photometryGraph: "WND-07",
  fileRoot: "WND-08",
  fileList: "WND-09",
  fileActionMenu: "WND-10",
  saveDialog: "WND-11",
  input: "WND-12",
  quantMain: "WND-13",
  quantUnits: "WND-14",
  quantCoef: "WND-15",
  calibrationSetupStandards: "WND-16",
  calibrationSetupParallels: "WND-17",
  calibrationPlan: "WND-18",
  calibrationStep: "WND-19",
  calibrationJournal: "WND-20",
  calibrationGraph: "WND-21",
  kineticsMenu: "WND-22",
  kineticsRun: "WND-23",
  kineticsGraph: "WND-24",
  multiWaveMenu: "WND-25",
  multiWaveSetup: "WND-26",
  multiWaveRun: "WND-27",
  multiWaveJournal: "WND-28",
  multiWaveGraph: "WND-29",
  settings: "WND-30",
  version: "WND-31",
  warning: "WND-32",
};

export const SCREEN_FLOW_NODES = [
  { id: "boot", label: "Boot", x: 40, y: 36 },
  { id: "diagnostic", label: "Diagnostic", x: 220, y: 36 },
  { id: "warmup", label: "Warmup", x: 400, y: 36 },
  { id: "main", label: "Main Menu", x: 600, y: 36 },
  { id: "photometry", label: "Photometry", x: 40, y: 168 },
  { id: "photometryValue", label: "Value Mode", x: 40, y: 292 },
  { id: "photometryGraph", label: "Photo Graph", x: 40, y: 416 },
  { id: "quantMain", label: "Quant Main", x: 250, y: 168 },
  { id: "quantUnits", label: "Units", x: 250, y: 292 },
  { id: "quantCoef", label: "Coeff", x: 250, y: 416 },
  { id: "calibrationSetupStandards", label: "Calib Std", x: 250, y: 540 },
  { id: "calibrationSetupParallels", label: "Calib Par", x: 430, y: 540 },
  { id: "calibrationPlan", label: "Calib Plan", x: 610, y: 540 },
  { id: "calibrationStep", label: "Calib Step", x: 790, y: 540 },
  { id: "calibrationJournal", label: "Calib Journal", x: 790, y: 664 },
  { id: "calibrationGraph", label: "Calib Graph", x: 970, y: 664 },
  { id: "kineticsMenu", label: "Kinetics", x: 460, y: 168 },
  { id: "kineticsRun", label: "Run", x: 460, y: 292 },
  { id: "kineticsGraph", label: "Kinetics Graph", x: 460, y: 416 },
  { id: "multiWaveMenu", label: "MultiWave", x: 670, y: 168 },
  { id: "multiWaveSetup", label: "Setup λ", x: 670, y: 292 },
  { id: "multiWaveRun", label: "Run λ", x: 670, y: 416 },
  { id: "multiWaveJournal", label: "MW Journal", x: 670, y: 540 },
  { id: "multiWaveGraph", label: "MW Graph", x: 670, y: 664 },
  { id: "settings", label: "Settings", x: 910, y: 168 },
  { id: "version", label: "Version", x: 1090, y: 168 },
  { id: "fileRoot", label: "File Root", x: 1090, y: 292 },
  { id: "fileList", label: "File List", x: 1090, y: 416 },
  { id: "fileActionMenu", label: "File Actions", x: 1090, y: 540 },
  { id: "saveDialog", label: "Save Dialog", x: 1270, y: 416 },
  { id: "input", label: "Input Dialog", x: 1270, y: 540 },
  { id: "warning", label: "Warning", x: 1270, y: 664 },
];

export const SCREEN_FLOW_EDGES = [
  ["boot", "diagnostic", "timer"],
  ["diagnostic", "warmup", "done"],
  ["warmup", "main", "esc/timer"],
  ["main", "photometry", "enter"],
  ["main", "quantMain", "enter"],
  ["main", "kineticsMenu", "enter"],
  ["main", "multiWaveMenu", "enter"],
  ["main", "settings", "enter"],
  ["main", "fileRoot", "file"],
  ["photometry", "photometryValue", "set"],
  ["photometry", "photometryGraph", "down"],
  ["photometry", "input", "goto λ"],
  ["photometry", "fileList", "file browse"],
  ["photometry", "saveDialog", "file save"],
  ["photometry", "main", "esc"],
  ["photometryValue", "photometry", "enter/esc"],
  ["photometryValue", "multiWaveMenu", "return mw"],
  ["photometryGraph", "photometry", "esc"],
  ["photometryGraph", "saveDialog", "file"],
  ["quantMain", "calibrationSetupStandards", "enter"],
  ["quantMain", "quantCoef", "enter"],
  ["quantMain", "quantUnits", "enter"],
  ["quantMain", "fileList", "file"],
  ["quantMain", "main", "esc"],
  ["quantUnits", "quantMain", "enter/esc"],
  ["quantUnits", "multiWaveMenu", "return mw"],
  ["quantCoef", "input", "1/2/goto λ"],
  ["quantCoef", "saveDialog", "file"],
  ["quantCoef", "quantMain", "esc"],
  ["calibrationSetupStandards", "calibrationSetupParallels", "enter"],
  ["calibrationSetupStandards", "quantMain", "esc"],
  ["calibrationSetupParallels", "calibrationPlan", "enter"],
  ["calibrationSetupParallels", "calibrationSetupStandards", "esc"],
  ["calibrationPlan", "calibrationStep", "enter"],
  ["calibrationPlan", "calibrationJournal", "down"],
  ["calibrationPlan", "fileList", "file"],
  ["calibrationPlan", "quantMain", "esc"],
  ["calibrationStep", "calibrationPlan", "esc"],
  ["calibrationStep", "calibrationJournal", "measure"],
  ["calibrationStep", "saveDialog", "file"],
  ["calibrationJournal", "calibrationPlan", "esc"],
  ["calibrationJournal", "calibrationStep", "enter/start/clear"],
  ["calibrationJournal", "calibrationGraph", "down/end"],
  ["calibrationJournal", "saveDialog", "file"],
  ["calibrationGraph", "calibrationJournal", "esc"],
  ["calibrationGraph", "saveDialog", "file"],
  ["kineticsMenu", "input", "enter upper/lower/duration"],
  ["kineticsMenu", "kineticsRun", "start"],
  ["kineticsMenu", "fileList", "file"],
  ["kineticsMenu", "main", "esc"],
  ["kineticsRun", "kineticsGraph", "down"],
  ["kineticsRun", "kineticsMenu", "stop/esc"],
  ["kineticsRun", "saveDialog", "file"],
  ["kineticsGraph", "kineticsRun", "esc"],
  ["kineticsGraph", "saveDialog", "file"],
  ["multiWaveMenu", "input", "count/parallel/goto λ"],
  ["multiWaveMenu", "multiWaveSetup", "enter count"],
  ["multiWaveMenu", "photometryValue", "signal"],
  ["multiWaveMenu", "quantUnits", "units"],
  ["multiWaveMenu", "multiWaveRun", "start"],
  ["multiWaveMenu", "fileList", "file"],
  ["multiWaveMenu", "main", "esc"],
  ["multiWaveSetup", "input", "edit λN"],
  ["multiWaveSetup", "multiWaveMenu", "esc"],
  ["multiWaveRun", "multiWaveJournal", "measure"],
  ["multiWaveRun", "saveDialog", "file save"],
  ["multiWaveRun", "fileList", "file browse"],
  ["multiWaveRun", "multiWaveMenu", "esc"],
  ["multiWaveJournal", "multiWaveRun", "enter/esc"],
  ["multiWaveJournal", "multiWaveGraph", "down"],
  ["multiWaveJournal", "saveDialog", "file"],
  ["multiWaveGraph", "multiWaveJournal", "esc"],
  ["multiWaveGraph", "saveDialog", "file"],
  ["settings", "version", "enter"],
  ["settings", "warning", "dark/wl"],
  ["settings", "main", "esc"],
  ["version", "settings", "enter/esc"],
  ["fileRoot", "fileList", "enter"],
  ["fileRoot", "main", "esc"],
  ["fileList", "fileActionMenu", "enter"],
  ["fileList", "fileRoot", "esc main"],
  ["fileActionMenu", "input", "rename"],
  ["fileActionMenu", "warning", "open/export"],
  ["warning", "warningReturn", "enter/esc"],
];

const DEFAULT_WARNING = {
  title: "ПРЕДУПРЕЖДЕНИЕ",
  body: "ПЕРЕХОД ИЗ КАРТЫ СЦЕНАРИЕВ",
};

export function transitionToScreen(state, target, overrides = {}) {
  const {
    keepPrevious = false,
    group,
    mode,
    fileContext,
    fileRootIndex,
    fileListIndex,
    fileActionIndex,
    inputTarget,
    inputBuffer,
    dialogTitle,
    returnScreen,
    saveMeta,
    warning,
    warningReturn,
    ...rest
  } = overrides;

  const previousScreen = keepPrevious
    ? (rest.previousScreen ?? state.previousScreen)
    : (rest.previousScreen ?? state.screen ?? state.previousScreen ?? "main");

  const next = {
    ...state,
    ...rest,
    previousScreen,
    screen: target,
  };

  if (target === "fileRoot") {
    return {
      ...next,
      fileRootIndex: typeof fileRootIndex === "number" ? fileRootIndex : state.fileRootIndex ?? 0,
      fileListIndex: 0,
      fileActionIndex: 0,
      fileContext: {
        ...state.fileContext,
        ...(fileContext ?? {}),
        ...(group ? { group } : {}),
        ...(mode ? { mode } : {}),
      },
    };
  }

  if (target === "fileList") {
    return {
      ...next,
      fileRootIndex: typeof fileRootIndex === "number" ? fileRootIndex : state.fileRootIndex ?? 0,
      fileListIndex: typeof fileListIndex === "number" ? fileListIndex : 0,
      fileActionIndex: 0,
      fileContext: {
        ...state.fileContext,
        ...(fileContext ?? {}),
        ...(group ? { group } : {}),
        ...(mode ? { mode } : {}),
      },
    };
  }

  if (target === "fileActionMenu") {
    return {
      ...next,
      fileActionIndex: typeof fileActionIndex === "number" ? fileActionIndex : 0,
      fileContext: {
        ...state.fileContext,
        ...(fileContext ?? {}),
        ...(group ? { group } : {}),
        ...(mode ? { mode } : {}),
      },
    };
  }

  if (target === "input") {
    return {
      ...next,
      inputTarget: inputTarget ?? state.inputTarget ?? "wavelength",
      inputBuffer: inputBuffer ?? state.inputBuffer ?? "",
      dialogTitle: dialogTitle ?? state.dialogTitle ?? "ВВОД ДАННЫХ",
      returnScreen: returnScreen ?? state.screen ?? state.returnScreen ?? "main",
    };
  }

  if (target === "saveDialog") {
    return {
      ...next,
      inputTarget: "saveName",
      inputBuffer: inputBuffer ?? "",
      returnScreen: returnScreen ?? state.screen ?? state.returnScreen ?? "main",
      saveMeta: saveMeta ?? state.saveMeta,
    };
  }

  if (target === "warning") {
    return {
      ...next,
      warning: warning ?? state.warning ?? DEFAULT_WARNING,
      warningReturn: warningReturn ?? state.screen ?? state.warningReturn ?? "main",
    };
  }

  return next;
}
