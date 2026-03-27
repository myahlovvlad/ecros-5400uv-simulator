import {
  FILE_ACTIONS,
  FILE_GROUPS,
  MENU_KINETICS,
  MENU_MAIN,
  MENU_PHOTOMETRY_VALUE,
  MENU_QUANT,
  MENU_SETTINGS,
  UNITS,
} from "../../domain/constants/index.js";
import { buildCalibrationPlan, getCalibrationResultIndexes } from "../../domain/usecases/index.js";

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function handleMainScreen(state, action, actions) {
  const { setDevice, openFileManager } = actions;

  if (action === "UP") return setDevice((d) => ({ ...d, mainIndex: (d.mainIndex + MENU_MAIN.length - 1) % MENU_MAIN.length }));
  if (action === "DOWN") return setDevice((d) => ({ ...d, mainIndex: (d.mainIndex + 1) % MENU_MAIN.length }));
  if (action === "FILE") return openFileManager(FILE_GROUPS[state.fileRootIndex], "browse", "main");

  if (action === "ENTER") {
    if (state.mainIndex === 0) return setDevice((d) => ({ ...d, screen: "photometry" }));
    if (state.mainIndex === 1) return setDevice((d) => ({ ...d, screen: "quantMain" }));
    if (state.mainIndex === 2) return setDevice((d) => ({ ...d, screen: "kineticsMenu" }));
    if (state.mainIndex === 3) return setDevice((d) => ({ ...d, screen: "settings" }));
  }
}

export function handleFileRootScreen(state, action, actions) {
  const { setDevice } = actions;

  if (action === "UP") return setDevice((d) => ({ ...d, fileRootIndex: (d.fileRootIndex + FILE_GROUPS.length - 1) % FILE_GROUPS.length }));
  if (action === "DOWN") return setDevice((d) => ({ ...d, fileRootIndex: (d.fileRootIndex + 1) % FILE_GROUPS.length }));
  if (action === "ESC") return setDevice((d) => ({ ...d, screen: d.previousScreen || "main" }));
  if (action === "ENTER") {
    const group = FILE_GROUPS[state.fileRootIndex];
    return setDevice((d) => ({ ...d, fileContext: { ...d.fileContext, group }, screen: "fileList", fileListIndex: 0 }));
  }
}

export function handleFileListScreen(state, action, actions) {
  const { setDevice } = actions;
  const list = state.files[state.fileContext.group] || [];

  if (action === "UP") return setDevice((d) => ({ ...d, fileListIndex: Math.max(0, d.fileListIndex - 1) }));
  if (action === "DOWN") return setDevice((d) => ({ ...d, fileListIndex: Math.min(Math.max(0, list.length - 1), d.fileListIndex + 1) }));
  if (action === "ESC") return setDevice((d) => ({ ...d, screen: d.previousScreen === "main" ? "fileRoot" : d.previousScreen }));
  if (action === "ENTER" && list.length) return setDevice((d) => ({ ...d, screen: "fileActionMenu", fileActionIndex: 0 }));
}

export function handleFileActionMenuScreen(state, action, actions) {
  const { setDevice, deleteFile, exportFile, openRenameDialog, logLine, showWarning } = actions;
  const group = state.fileContext.group;
  const files = state.files[group] || [];
  const selected = files[state.fileListIndex];

  if (action === "UP") return setDevice((d) => ({ ...d, fileActionIndex: (d.fileActionIndex + FILE_ACTIONS.length - 1) % FILE_ACTIONS.length }));
  if (action === "DOWN") return setDevice((d) => ({ ...d, fileActionIndex: (d.fileActionIndex + 1) % FILE_ACTIONS.length }));
  if (action === "ESC") return setDevice((d) => ({ ...d, screen: "fileList" }));

  if (action === "ENTER" && selected) {
    const currentAction = FILE_ACTIONS[state.fileActionIndex];

    if (currentAction === "ОТКРЫТЬ") return showWarning("ОТКРЫТИЕ", `${selected.name}${selected.ext}`, "fileList");
    if (currentAction === "ПЕРЕИМЕНОВАТЬ") return openRenameDialog(selected.name);
    if (currentAction === "УДАЛИТЬ") {
      const result = deleteFile(group, state.fileListIndex);
      logLine(result.logEntry);
      return setDevice(result.newState);
    }
    if (currentAction === "ЭКСПОРТ") {
      const result = exportFile(group, state.fileListIndex);
      logLine(result.logEntry);
      setDevice(result.newState);
      return showWarning("ЭКСПОРТ", `ФАЙЛ ${selected.name}${selected.ext} ОТПРАВЛЕН НА USB1`, "fileList");
    }
  }
}

export function handlePhotometryScreen(state, action, actions) {
  const { setDevice, performRezero, performPhotometryMeasure, openFileManager, openSaveDialog } = actions;

  if (action === "GOTOλ") {
    return setDevice((d) => ({
      ...d,
      screen: "input",
      inputTarget: "wavelength",
      inputBuffer: `${d.wavelength.toFixed(1)}`,
      dialogTitle: "ВВЕДИТЕ ЛЯМ, НМ",
      returnScreen: "photometry",
    }));
  }
  if (action === "ZERO") return performRezero();
  if (action === "START/STOP") return performPhotometryMeasure();
  if (action === "SET") return setDevice((d) => ({ ...d, screen: "photometryValue" }));
  if (action === "CLEAR") {
    return setDevice((d) => ({ ...d, measurements: d.measurements.slice(0, -1), measurementCursor: Math.max(0, d.measurementCursor - 1) }));
  }
  if (action === "FILE") {
    if (state.measurements.length) return openSaveDialog("ФОТОМЕТРИЯ", "photometry");
    return openFileManager("ФОТОМЕТРИЯ", "browse", "photometry");
  }
  if (action === "UP" && state.measurements.length) return setDevice((d) => ({ ...d, measurementCursor: Math.max(0, d.measurementCursor - 1) }));
  if (action === "DOWN") {
    if (!state.measurements.length) return;
    if (state.measurementCursor >= state.measurements.length - 1) return setDevice((d) => ({ ...d, screen: "photometryGraph" }));
    return setDevice((d) => ({ ...d, measurementCursor: Math.min(d.measurements.length - 1, d.measurementCursor + 1) }));
  }
  if (action === "ESC") return setDevice((d) => ({ ...d, screen: "main" }));
}

export function handlePhotometryValueScreen(state, action, actions) {
  const { setDevice } = actions;

  if (action === "UP") return setDevice((d) => ({ ...d, photometryValueIndex: (d.photometryValueIndex + MENU_PHOTOMETRY_VALUE.length - 1) % MENU_PHOTOMETRY_VALUE.length }));
  if (action === "DOWN") return setDevice((d) => ({ ...d, photometryValueIndex: (d.photometryValueIndex + 1) % MENU_PHOTOMETRY_VALUE.length }));
  if (action === "ENTER" || action === "ESC") return setDevice((d) => ({ ...d, screen: "photometry" }));
}

export function handleQuantMainScreen(state, action, actions) {
  const { setDevice, openFileManager } = actions;

  if (action === "UP") return setDevice((d) => ({ ...d, quantIndex: (d.quantIndex + MENU_QUANT.length - 1) % MENU_QUANT.length }));
  if (action === "DOWN") return setDevice((d) => ({ ...d, quantIndex: (d.quantIndex + 1) % MENU_QUANT.length }));
  if (action === "FILE") return openFileManager("ГРАДУИРОВКА", "browse", "quantMain");
  if (action === "ENTER") {
    if (state.quantIndex === 0) return setDevice((d) => ({ ...d, screen: "calibrationSetupStandards" }));
    if (state.quantIndex === 1) return setDevice((d) => ({ ...d, screen: "quantCoef" }));
    if (state.quantIndex === 2) return setDevice((d) => ({ ...d, screen: "quantUnits" }));
  }
  if (action === "ESC") return setDevice((d) => ({ ...d, screen: "main" }));
}

export function handleQuantUnitsScreen(state, action, actions) {
  const { setDevice } = actions;

  if (action === "UP") return setDevice((d) => ({ ...d, unitsIndex: (d.unitsIndex + UNITS.length - 1) % UNITS.length }));
  if (action === "DOWN") return setDevice((d) => ({ ...d, unitsIndex: (d.unitsIndex + 1) % UNITS.length }));
  if (action === "ENTER" || action === "ESC") return setDevice((d) => ({ ...d, screen: "quantMain" }));
}

export function handleQuantCoefScreen(state, action, actions) {
  const { setDevice, performPhotometryMeasure, performRezero, openSaveDialog, showWarning } = actions;

  if (action === "START/STOP") return performPhotometryMeasure();
  if (action === "SET") return showWarning("РЕДАКТИРОВАНИЕ", "1=К 2=Б", "quantCoef");
  if (action === "1") {
    return setDevice((d) => ({ ...d, screen: "input", inputTarget: "quantK", inputBuffer: String(d.quantK), dialogTitle: "ВВЕДИТЕ К", returnScreen: "quantCoef" }));
  }
  if (action === "2") {
    return setDevice((d) => ({ ...d, screen: "input", inputTarget: "quantB", inputBuffer: String(d.quantB), dialogTitle: "ВВЕДИТЕ Б", returnScreen: "quantCoef" }));
  }
  if (action === "GOTOλ") {
    return setDevice((d) => ({
      ...d,
      screen: "input",
      inputTarget: "wavelength",
      inputBuffer: `${d.wavelength.toFixed(1)}`,
      dialogTitle: "ВВЕДИТЕ ЛЯМ, НМ",
      returnScreen: "quantCoef",
    }));
  }
  if (action === "ZERO") return performRezero();
  if (action === "FILE") return openSaveDialog("КОЭФФИЦИЕНТ", "quantCoef");
  if (action === "ESC") return setDevice((d) => ({ ...d, screen: "quantMain" }));
}

export function handleCalibrationSetupStandardsScreen(state, action, actions) {
  const { setDevice } = actions;

  if (action === "UP") return setDevice((d) => ({ ...d, calibration: { ...d.calibration, standards: clamp(d.calibration.standards + 1, 1, 9) } }));
  if (action === "DOWN") return setDevice((d) => ({ ...d, calibration: { ...d.calibration, standards: clamp(d.calibration.standards - 1, 1, 9) } }));
  if (action === "ENTER") return setDevice((d) => ({ ...d, screen: "calibrationSetupParallels" }));
  if (action === "ESC") return setDevice((d) => ({ ...d, screen: "quantMain" }));
}

export function handleCalibrationSetupParallelsScreen(state, action, actions) {
  const { setDevice } = actions;

  if (action === "UP") return setDevice((d) => ({ ...d, calibration: { ...d.calibration, parallels: clamp(d.calibration.parallels + 1, 1, 9) } }));
  if (action === "DOWN") return setDevice((d) => ({ ...d, calibration: { ...d.calibration, parallels: clamp(d.calibration.parallels - 1, 1, 9) } }));
  if (action === "ENTER") {
    const plan = buildCalibrationPlan(state.calibration.standards, state.calibration.parallels);
    return setDevice((d) => ({ ...d, calibration: { ...d.calibration, stepIndex: 0, resultCursor: 0, plan }, screen: "calibrationPlan" }));
  }
  if (action === "ESC") return setDevice((d) => ({ ...d, screen: "calibrationSetupStandards" }));
}

export function handleCalibrationPlanScreen(state, action, actions) {
  const { setDevice, performRezero, openFileManager } = actions;

  if (action === "ZERO") return performRezero();
  if (action === "ENTER") return setDevice((d) => ({ ...d, screen: "calibrationStep" }));
  if (action === "DOWN") {
    const lastMeasured = getCalibrationResultIndexes(state.calibration.plan).at(-1);
    if (typeof lastMeasured === "number") {
      return setDevice((d) => ({ ...d, calibration: { ...d.calibration, resultCursor: lastMeasured }, screen: "calibrationJournal" }));
    }
    return;
  }
  if (action === "FILE") return openFileManager("ГРАДУИРОВКА", "browse", "calibrationPlan");
  if (action === "ESC") return setDevice((d) => ({ ...d, screen: "quantMain" }));
}

export function handleCalibrationStepScreen(state, action, actions) {
  const { setDevice, performRezero, performCalibrationMeasure, openSaveDialog } = actions;

  if (action === "ZERO") return performRezero();
  if (action === "START/STOP") return performCalibrationMeasure();
  if (action === "FILE") return openSaveDialog("ГРАДУИРОВКА", "calibrationStep");
  if (action === "ESC") return setDevice((d) => ({ ...d, screen: "calibrationPlan" }));
}

export function handleCalibrationJournalScreen(state, action, actions) {
  const {
    performRezero,
    openSaveDialog,
    moveCalibrationCursor,
    nextCalibrationStep,
    remeasureCalibrationAtCursor,
    deleteCalibrationAtCursor,
    setDevice,
  } = actions;

  if (action === "UP") return moveCalibrationCursor("up");
  if (action === "DOWN") return moveCalibrationCursor("down");
  if (action === "ENTER") return nextCalibrationStep();
  if (action === "START/STOP") return remeasureCalibrationAtCursor();
  if (action === "CLEAR") return deleteCalibrationAtCursor();
  if (action === "FILE") return openSaveDialog("ГРАДУИРОВКА", "calibrationJournal");
  if (action === "ESC") return setDevice((d) => ({ ...d, screen: "calibrationPlan" }));
  if (action === "ZERO") return performRezero();
}

export function handleKineticsMenuScreen(state, action, actions) {
  const { setDevice, performRezero, openFileManager, startKinetics } = actions;

  if (action === "UP") return setDevice((d) => ({ ...d, kineticsIndex: (d.kineticsIndex + MENU_KINETICS.length - 1) % MENU_KINETICS.length }));
  if (action === "DOWN") return setDevice((d) => ({ ...d, kineticsIndex: (d.kineticsIndex + 1) % MENU_KINETICS.length }));
  if (action === "ENTER") {
    if (state.kineticsIndex === 1) return setDevice((d) => ({ ...d, screen: "input", inputTarget: "kinUpper", inputBuffer: String(d.kineticUpper), dialogTitle: "ВЕРХ. ГРАНИЦА", returnScreen: "kineticsMenu" }));
    if (state.kineticsIndex === 2) return setDevice((d) => ({ ...d, screen: "input", inputTarget: "kinLower", inputBuffer: String(d.kineticLower), dialogTitle: "НИЖ. ГРАНИЦА", returnScreen: "kineticsMenu" }));
    if (state.kineticsIndex === 3) return setDevice((d) => ({ ...d, screen: "input", inputTarget: "kinDuration", inputBuffer: String(d.kineticDuration), dialogTitle: "ОБЩЕЕ ВРЕМЯ", returnScreen: "kineticsMenu" }));
    if (state.kineticsIndex === 4) return startKinetics();
  }
  if (action === "ZERO") return performRezero();
  if (action === "GOTOλ") {
    return setDevice((d) => ({
      ...d,
      screen: "input",
      inputTarget: "wavelength",
      inputBuffer: `${d.wavelength.toFixed(1)}`,
      dialogTitle: "ВВЕДИТЕ ЛЯМ, НМ",
      returnScreen: "kineticsMenu",
    }));
  }
  if (action === "FILE") return openFileManager("КИНЕТИКА", "browse", "kineticsMenu");
  if (action === "ESC") return setDevice((d) => ({ ...d, screen: "main" }));
}

export function handleKineticsRunScreen(state, action, actions) {
  const { setDevice, stopKinetics, openSaveDialog } = actions;

  if (action === "START/STOP") return stopKinetics();
  if (action === "DOWN") return setDevice((d) => ({ ...d, screen: "kineticsGraph" }));
  if (action === "FILE") return openSaveDialog("КИНЕТИКА", "kineticsRun");
  if (action === "ESC") return stopKinetics();
}

export function handleSettingsScreen(state, action, actions) {
  const { setDevice, performDarkCurrent, performWavelengthCalibration, resetAll } = actions;

  if (action === "UP") return setDevice((d) => ({ ...d, settingsIndex: (d.settingsIndex + MENU_SETTINGS.length - 1) % MENU_SETTINGS.length }));
  if (action === "DOWN") return setDevice((d) => ({ ...d, settingsIndex: (d.settingsIndex + 1) % MENU_SETTINGS.length }));
  if (action === "ENTER") {
    if (state.settingsIndex === 0) return setDevice((d) => ({ ...d, d2Lamp: !d.d2Lamp }));
    if (state.settingsIndex === 1) return setDevice((d) => ({ ...d, wLamp: !d.wLamp }));
    if (state.settingsIndex === 2) return performDarkCurrent();
    if (state.settingsIndex === 3) return performWavelengthCalibration();
    if (state.settingsIndex === 4) return setDevice((d) => ({ ...d, screen: "version" }));
    if (state.settingsIndex === 5) return resetAll();
  }
  if (action === "ESC") return setDevice((d) => ({ ...d, screen: "main" }));
}

export function handleVersionScreen(state, action, actions) {
  const { setDevice } = actions;
  if (action === "ENTER" || action === "ESC") return setDevice((d) => ({ ...d, screen: "settings" }));
}

export function handleWarningScreen(state, action, actions) {
  const { setDevice } = actions;
  if (action === "ESC" || action === "ENTER") return setDevice((d) => ({ ...d, screen: d.warningReturn, warning: null }));
}

export function handleWarmupScreen(state, action, actions) {
  const { setDevice } = actions;
  return setDevice((d) => ({ ...d, screen: "main" }));
}

export function handleInputScreen(state, action, actions) {
  const { setDevice, handleInputAction } = actions;
  if (action === "ESC") {
    return setDevice((d) => ({ ...d, inputBuffer: "", inputTarget: null, screen: d.returnScreen || d.previousScreen || "main" }));
  }
  return handleInputAction(action);
}

export function handleSaveDialogScreen(state, action, actions) {
  const { setDevice, handleInputAction } = actions;
  if (action === "ESC") {
    return setDevice((d) => ({ ...d, inputBuffer: "", inputTarget: null, screen: d.returnScreen || d.previousScreen || "main" }));
  }
  return handleInputAction(action);
}
