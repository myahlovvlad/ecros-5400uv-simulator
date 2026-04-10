import {
  FILE_ACTIONS,
  FILE_GROUPS,
  MENU_KINETICS,
  MENU_MAIN,
  MENU_MULTI_WAVE,
  MENU_PHOTOMETRY_VALUE,
  MENU_QUANT,
  MENU_SETTINGS,
  MULTI_WAVE_MAX_COUNT,
  MULTI_WAVE_MIN_COUNT,
  UNITS,
} from "../../domain/constants/index.js";
import { transitionToScreen } from "./screenFlow.js";
import { buildCalibrationPlan, getCalibrationResultIndexes } from "../../domain/usecases/index.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function openWavelengthInput(setDevice, returnScreen, wavelength) {
  return setDevice((device) => transitionToScreen(device, "input", {
    inputTarget: "wavelength",
    inputBuffer: `${wavelength.toFixed(1)}`,
    dialogTitle: "ВВЕДИТЕ ЛЯМ, НМ",
    returnScreen,
  }));
}

export function handleMainScreen(state, action, actions) {
  const { setDevice, openFileManager } = actions;

  if (action === "UP") return setDevice((device) => ({ ...device, mainIndex: (device.mainIndex + MENU_MAIN.length - 1) % MENU_MAIN.length }));
  if (action === "DOWN") return setDevice((device) => ({ ...device, mainIndex: (device.mainIndex + 1) % MENU_MAIN.length }));
  if (action === "FILE") return openFileManager(FILE_GROUPS[state.fileRootIndex], "browse", "main");

  if (action === "ENTER") {
    if (state.mainIndex === 0) return setDevice((device) => transitionToScreen(device, "photometry"));
    if (state.mainIndex === 1) return setDevice((device) => transitionToScreen(device, "quantMain"));
    if (state.mainIndex === 2) return setDevice((device) => transitionToScreen(device, "kineticsMenu"));
    if (state.mainIndex === 3) return setDevice((device) => transitionToScreen(device, "multiWaveMenu"));
    if (state.mainIndex === 4) return setDevice((device) => transitionToScreen(device, "settings"));
  }
}

export function handleFileRootScreen(state, action, actions) {
  const { setDevice } = actions;

  if (action === "UP") return setDevice((device) => ({ ...device, fileRootIndex: (device.fileRootIndex + FILE_GROUPS.length - 1) % FILE_GROUPS.length }));
  if (action === "DOWN") return setDevice((device) => ({ ...device, fileRootIndex: (device.fileRootIndex + 1) % FILE_GROUPS.length }));
  if (action === "ESC") return setDevice((device) => transitionToScreen(device, device.previousScreen || "main"));
  if (action === "ENTER") {
    const group = FILE_GROUPS[state.fileRootIndex];
    return setDevice((device) => transitionToScreen(device, "fileList", {
      fileContext: { ...device.fileContext, group },
      fileListIndex: 0,
    }));
  }
}

export function handleFileListScreen(state, action, actions) {
  const { setDevice } = actions;
  const list = state.files[state.fileContext.group] || [];

  if (action === "UP") return setDevice((device) => ({ ...device, fileListIndex: Math.max(0, device.fileListIndex - 1) }));
  if (action === "DOWN") return setDevice((device) => ({ ...device, fileListIndex: Math.min(Math.max(0, list.length - 1), device.fileListIndex + 1) }));
  if (action === "ESC") return setDevice((device) => transitionToScreen(device, device.previousScreen === "main" ? "fileRoot" : device.previousScreen));
  if (action === "ENTER" && list.length) return setDevice((device) => transitionToScreen(device, "fileActionMenu", { fileActionIndex: 0 }));
}

export function handleFileActionMenuScreen(state, action, actions) {
  const { setDevice, deleteFile, exportFile, openRenameDialog, logLine, showWarning } = actions;
  const group = state.fileContext.group;
  const files = state.files[group] || [];
  const selected = files[state.fileListIndex];

  if (action === "UP") return setDevice((device) => ({ ...device, fileActionIndex: (device.fileActionIndex + FILE_ACTIONS.length - 1) % FILE_ACTIONS.length }));
  if (action === "DOWN") return setDevice((device) => ({ ...device, fileActionIndex: (device.fileActionIndex + 1) % FILE_ACTIONS.length }));
  if (action === "ESC") return setDevice((device) => transitionToScreen(device, "fileList"));

  if (action === "ENTER" && selected) {
    const currentAction = FILE_ACTIONS[state.fileActionIndex];

    if (currentAction === "ОТКРЫТЬ") return showWarning("ОТКРЫТИЕ", `${selected.name}${selected.ext}`, "fileList");
    if (currentAction === "ПЕРЕИМЕНОВАТЬ") return openRenameDialog(selected.name);
    if (currentAction === "УДАЛИТЬ") {
      const result = deleteFile(group, state.fileListIndex);
      if (result.logEntry) logLine(result.logEntry);
      return setDevice(result.newState);
    }
    if (currentAction === "ЭКСПОРТ") {
      const result = exportFile(group, state.fileListIndex);
      if (result.logEntry) logLine(result.logEntry);
      setDevice(result.newState);
      return showWarning("ЭКСПОРТ", `ФАЙЛ ${selected.name}${selected.ext} ОТПРАВЛЕН НА USB1`, "fileList");
    }
  }
}

export function handlePhotometryScreen(state, action, actions) {
  const { setDevice, performRezero, performPhotometryMeasure, openFileManager, openSaveDialog } = actions;

  if (action === "GOTOλ") return openWavelengthInput(setDevice, "photometry", state.wavelength);
  if (action === "ZERO") return performRezero();
  if (action === "START/STOP") return performPhotometryMeasure();
  if (action === "SET") return setDevice((device) => transitionToScreen(device, "photometryValue", { returnScreen: "photometry" }));
  if (action === "CLEAR") {
    return setDevice((device) => ({ ...device, measurements: device.measurements.slice(0, -1), measurementCursor: Math.max(0, device.measurementCursor - 1) }));
  }
  if (action === "FILE") {
    if (state.measurements.length) return openSaveDialog("ФОТОМЕТРИЯ", "photometry");
    return openFileManager("ФОТОМЕТРИЯ", "browse", "photometry");
  }
  if (action === "UP" && state.measurements.length) return setDevice((device) => ({ ...device, measurementCursor: Math.max(0, device.measurementCursor - 1) }));
  if (action === "DOWN") {
    if (!state.measurements.length) return;
    if (state.measurementCursor >= state.measurements.length - 1) return setDevice((device) => transitionToScreen(device, "photometryGraph"));
    return setDevice((device) => ({ ...device, measurementCursor: Math.min(device.measurements.length - 1, device.measurementCursor + 1) }));
  }
  if (action === "ESC") return setDevice((device) => transitionToScreen(device, "main"));
}

export function handlePhotometryGraphScreen(state, action, actions) {
  const { setDevice, openSaveDialog } = actions;
  if (action === "FILE") return openSaveDialog("ФОТОМЕТРИЯ", "photometryGraph");
  if (action === "ESC") return setDevice((device) => transitionToScreen(device, "photometry"));
}

export function handlePhotometryValueScreen(state, action, actions) {
  const { setDevice } = actions;
  const returnScreen = state.returnScreen || "photometry";

  if (action === "UP") return setDevice((device) => ({ ...device, photometryValueIndex: (device.photometryValueIndex + MENU_PHOTOMETRY_VALUE.length - 1) % MENU_PHOTOMETRY_VALUE.length }));
  if (action === "DOWN") return setDevice((device) => ({ ...device, photometryValueIndex: (device.photometryValueIndex + 1) % MENU_PHOTOMETRY_VALUE.length }));
  if (action === "ENTER" || action === "ESC") return setDevice((device) => transitionToScreen(device, returnScreen));
}

export function handleQuantMainScreen(state, action, actions) {
  const { setDevice, openFileManager } = actions;

  if (action === "UP") return setDevice((device) => ({ ...device, quantIndex: (device.quantIndex + MENU_QUANT.length - 1) % MENU_QUANT.length }));
  if (action === "DOWN") return setDevice((device) => ({ ...device, quantIndex: (device.quantIndex + 1) % MENU_QUANT.length }));
  if (action === "FILE") return openFileManager("ГРАДУИРОВКА", "browse", "quantMain");
  if (action === "ENTER") {
    if (state.quantIndex === 0) return setDevice((device) => transitionToScreen(device, "calibrationSetupStandards"));
    if (state.quantIndex === 1) return setDevice((device) => transitionToScreen(device, "quantCoef"));
    if (state.quantIndex === 2) return setDevice((device) => transitionToScreen(device, "quantUnits", { returnScreen: "quantMain" }));
  }
  if (action === "ESC") return setDevice((device) => transitionToScreen(device, "main"));
}

export function handleQuantUnitsScreen(state, action, actions) {
  const { setDevice } = actions;
  const returnScreen = state.returnScreen || "quantMain";

  if (action === "UP") return setDevice((device) => ({ ...device, unitsIndex: (device.unitsIndex + UNITS.length - 1) % UNITS.length }));
  if (action === "DOWN") return setDevice((device) => ({ ...device, unitsIndex: (device.unitsIndex + 1) % UNITS.length }));
  if (action === "ENTER" || action === "ESC") return setDevice((device) => transitionToScreen(device, returnScreen));
}

export function handleQuantCoefScreen(state, action, actions) {
  const { setDevice, performPhotometryMeasure, performRezero, openSaveDialog, showWarning } = actions;

  if (action === "START/STOP") return performPhotometryMeasure();
  if (action === "SET") return showWarning("РЕДАКТИРОВАНИЕ", "1=К 2=Б", "quantCoef");
  if (action === "1") {
    return setDevice((device) => transitionToScreen(device, "input", { inputTarget: "quantK", inputBuffer: String(device.quantK), dialogTitle: "ВВЕДИТЕ К", returnScreen: "quantCoef" }));
  }
  if (action === "2") {
    return setDevice((device) => transitionToScreen(device, "input", { inputTarget: "quantB", inputBuffer: String(device.quantB), dialogTitle: "ВВЕДИТЕ Б", returnScreen: "quantCoef" }));
  }
  if (action === "GOTOλ") return openWavelengthInput(setDevice, "quantCoef", state.wavelength);
  if (action === "ZERO") return performRezero();
  if (action === "FILE") return openSaveDialog("КОЭФФИЦИЕНТ", "quantCoef");
  if (action === "ESC") return setDevice((device) => transitionToScreen(device, "quantMain"));
}

export function handleCalibrationSetupStandardsScreen(state, action, actions) {
  const { setDevice } = actions;

  if (action === "UP") return setDevice((device) => ({ ...device, calibration: { ...device.calibration, standards: clamp(device.calibration.standards + 1, 1, 9) } }));
  if (action === "DOWN") return setDevice((device) => ({ ...device, calibration: { ...device.calibration, standards: clamp(device.calibration.standards - 1, 1, 9) } }));
  if (action === "ENTER") return setDevice((device) => transitionToScreen(device, "calibrationSetupParallels"));
  if (action === "ESC") return setDevice((device) => transitionToScreen(device, "quantMain"));
}

export function handleCalibrationSetupParallelsScreen(state, action, actions) {
  const { setDevice } = actions;

  if (action === "UP") return setDevice((device) => ({ ...device, calibration: { ...device.calibration, parallels: clamp(device.calibration.parallels + 1, 1, 9) } }));
  if (action === "DOWN") return setDevice((device) => ({ ...device, calibration: { ...device.calibration, parallels: clamp(device.calibration.parallels - 1, 1, 9) } }));
  if (action === "ENTER") {
    const plan = buildCalibrationPlan(state.calibration.standards, state.calibration.parallels);
    return setDevice((device) => transitionToScreen(
      { ...device, calibration: { ...device.calibration, stepIndex: 0, resultCursor: 0, plan } },
      "calibrationPlan",
    ));
  }
  if (action === "ESC") return setDevice((device) => transitionToScreen(device, "calibrationSetupStandards"));
}

export function handleCalibrationPlanScreen(state, action, actions) {
  const { setDevice, performRezero, openFileManager } = actions;

  if (action === "ZERO") return performRezero();
  if (action === "ENTER") return setDevice((device) => transitionToScreen(device, "calibrationStep"));
  if (action === "DOWN") {
    const lastMeasured = getCalibrationResultIndexes(state.calibration.plan).at(-1);
    if (typeof lastMeasured === "number") {
      return setDevice((device) => transitionToScreen(
        { ...device, calibration: { ...device.calibration, resultCursor: lastMeasured } },
        "calibrationJournal",
      ));
    }
    return;
  }
  if (action === "FILE") return openFileManager("ГРАДУИРОВКА", "browse", "calibrationPlan");
  if (action === "ESC") return setDevice((device) => transitionToScreen(device, "quantMain"));
}

export function handleCalibrationStepScreen(state, action, actions) {
  const { setDevice, performRezero, performCalibrationMeasure, openSaveDialog } = actions;

  if (action === "ZERO") return performRezero();
  if (action === "START/STOP" || action === "ENTER") return performCalibrationMeasure();
  if (action === "FILE") return openSaveDialog("ГРАДУИРОВКА", "calibrationStep");
  if (action === "ESC") return setDevice((device) => transitionToScreen(device, "calibrationPlan"));
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
  if (action === "ESC") return setDevice((device) => transitionToScreen(device, "calibrationPlan"));
  if (action === "ZERO") return performRezero();
}

export function handleCalibrationGraphScreen(state, action, actions) {
  const { setDevice, openSaveDialog } = actions;
  if (action === "FILE") return openSaveDialog("ГРАДУИРОВКА", "calibrationGraph");
  if (action === "ESC") return setDevice((device) => transitionToScreen(device, "calibrationJournal"));
}

export function handleKineticsMenuScreen(state, action, actions) {
  const { setDevice, performRezero, openFileManager, startKinetics } = actions;

  if (action === "UP") return setDevice((device) => ({ ...device, kineticsIndex: (device.kineticsIndex + MENU_KINETICS.length - 1) % MENU_KINETICS.length }));
  if (action === "DOWN") return setDevice((device) => ({ ...device, kineticsIndex: (device.kineticsIndex + 1) % MENU_KINETICS.length }));
  if (action === "ENTER") {
    if (state.kineticsIndex === 1) return setDevice((device) => transitionToScreen(device, "input", { inputTarget: "kinUpper", inputBuffer: String(device.kineticUpper), dialogTitle: "ВЕРХ. ГРАНИЦА", returnScreen: "kineticsMenu" }));
    if (state.kineticsIndex === 2) return setDevice((device) => transitionToScreen(device, "input", { inputTarget: "kinLower", inputBuffer: String(device.kineticLower), dialogTitle: "НИЖ. ГРАНИЦА", returnScreen: "kineticsMenu" }));
    if (state.kineticsIndex === 3) return setDevice((device) => transitionToScreen(device, "input", { inputTarget: "kinDuration", inputBuffer: String(device.kineticDuration), dialogTitle: "ОБЩЕЕ ВРЕМЯ", returnScreen: "kineticsMenu" }));
    if (state.kineticsIndex === 4) return startKinetics();
  }
  if (action === "ZERO") return performRezero();
  if (action === "GOTOλ") return openWavelengthInput(setDevice, "kineticsMenu", state.wavelength);
  if (action === "FILE") return openFileManager("КИНЕТИКА", "browse", "kineticsMenu");
  if (action === "ESC") return setDevice((device) => transitionToScreen(device, "main"));
}

export function handleKineticsRunScreen(state, action, actions) {
  const { setDevice, stopKinetics, openSaveDialog } = actions;

  if (action === "START/STOP") return stopKinetics();
  if (action === "DOWN") return setDevice((device) => transitionToScreen(device, "kineticsGraph"));
  if (action === "FILE") return openSaveDialog("КИНЕТИКА", "kineticsRun");
  if (action === "ESC") return stopKinetics();
}

export function handleKineticsGraphScreen(state, action, actions) {
  const { setDevice, openSaveDialog } = actions;
  if (action === "FILE") return openSaveDialog("КИНЕТИКА", "kineticsGraph");
  if (action === "ESC") return setDevice((device) => transitionToScreen(device, "kineticsRun"));
}

export function handleMultiWaveMenuScreen(state, action, actions) {
  const { setDevice, openFileManager, startMultiWave } = actions;

  if (action === "UP") return setDevice((device) => ({ ...device, multiWaveIndex: (device.multiWaveIndex + MENU_MULTI_WAVE.length - 1) % MENU_MULTI_WAVE.length }));
  if (action === "DOWN") return setDevice((device) => ({ ...device, multiWaveIndex: (device.multiWaveIndex + 1) % MENU_MULTI_WAVE.length }));
  if (action === "ENTER") {
    if (state.multiWaveIndex === 0) {
      return setDevice((device) => transitionToScreen(device, "input", {
        inputTarget: "multiWaveCount",
        inputBuffer: String(device.multiWaveCount),
        dialogTitle: "ЧИСЛО ДЛИН ВОЛН",
        returnScreen: "multiWaveMenu",
      }));
    }
    if (state.multiWaveIndex === 1) {
      return setDevice((device) => transitionToScreen(device, "input", {
        inputTarget: "parallelCount",
        inputBuffer: String(device.multiWaveParallelCount),
        dialogTitle: "ПАРАЛ. ИЗМ.",
        returnScreen: "multiWaveMenu",
      }));
    }
    if (state.multiWaveIndex === 2) return setDevice((device) => transitionToScreen(device, "photometryValue", { returnScreen: "multiWaveMenu" }));
    if (state.multiWaveIndex === 3) return setDevice((device) => transitionToScreen(device, "quantUnits", { returnScreen: "multiWaveMenu" }));
    if (state.multiWaveIndex === 4) return startMultiWave();
  }
  if (action === "GOTOλ") return openWavelengthInput(setDevice, "multiWaveMenu", state.wavelength);
  if (action === "FILE") return openFileManager("МНОГОВОЛН.", "browse", "multiWaveMenu");
  if (action === "ESC") return setDevice((device) => transitionToScreen(device, "main"));
}

export function handleMultiWaveSetupScreen(state, action, actions) {
  const { setDevice } = actions;
  const maxIndex = Math.max(MULTI_WAVE_MIN_COUNT, Math.min(state.multiWaveCount, MULTI_WAVE_MAX_COUNT)) - 1;

  if (action === "UP") return setDevice((device) => ({ ...device, multiWaveSetupIndex: Math.max(0, device.multiWaveSetupIndex - 1) }));
  if (action === "DOWN") return setDevice((device) => ({ ...device, multiWaveSetupIndex: Math.min(maxIndex, device.multiWaveSetupIndex + 1) }));
  if (action === "ENTER") {
    return setDevice((device) => transitionToScreen(device, "input", {
      inputTarget: `multiWaveWavelength_${device.multiWaveSetupIndex}`,
      inputBuffer: String(device.multiWaveWavelengths[device.multiWaveSetupIndex] ?? device.wavelength),
      dialogTitle: `ВВЕДИТЕ λ${device.multiWaveSetupIndex + 1}`,
      returnScreen: "multiWaveSetup",
    }));
  }
  if (action === "ESC") return setDevice((device) => transitionToScreen(device, "multiWaveMenu"));
}

export function handleMultiWaveRunScreen(state, action, actions) {
  const { setDevice, performRezero, performMultiWaveRun, openFileManager, openSaveDialog } = actions;

  if (action === "ZERO") return performRezero();
  if (action === "START/STOP" || action === "ENTER") return performMultiWaveRun();
  if (action === "FILE") {
    if (state.multiWaveMeasurements.length) return openSaveDialog("МНОГОВОЛН.", "multiWaveRun");
    return openFileManager("МНОГОВОЛН.", "browse", "multiWaveRun");
  }
  if (action === "ESC") return setDevice((device) => transitionToScreen(device, "multiWaveMenu"));
}

export function handleMultiWaveJournalScreen(state, action, actions) {
  const { setDevice, moveMultiWaveCursor, openSaveDialog } = actions;

  if (action === "UP") return moveMultiWaveCursor("up");
  if (action === "DOWN") return moveMultiWaveCursor("down");
  if (action === "ENTER" || action === "ESC") return setDevice((device) => transitionToScreen(device, "multiWaveRun"));
  if (action === "FILE") return openSaveDialog("МНОГОВОЛН.", "multiWaveJournal");
}

export function handleMultiWaveGraphScreen(state, action, actions) {
  const { setDevice, openSaveDialog } = actions;
  if (action === "FILE") return openSaveDialog("МНОГОВОЛН.", "multiWaveGraph");
  if (action === "ESC") return setDevice((device) => transitionToScreen(device, "multiWaveJournal"));
}

export function handleSettingsScreen(state, action, actions) {
  const { setDevice, performDarkCurrent, performWavelengthCalibration, resetAll } = actions;

  if (action === "UP") return setDevice((device) => ({ ...device, settingsIndex: (device.settingsIndex + MENU_SETTINGS.length - 1) % MENU_SETTINGS.length }));
  if (action === "DOWN") return setDevice((device) => ({ ...device, settingsIndex: (device.settingsIndex + 1) % MENU_SETTINGS.length }));
  if (action === "ENTER") {
    if (state.settingsIndex === 0) return setDevice((device) => ({ ...device, d2Lamp: !device.d2Lamp }));
    if (state.settingsIndex === 1) return setDevice((device) => ({ ...device, wLamp: !device.wLamp }));
    if (state.settingsIndex === 2) return performDarkCurrent();
    if (state.settingsIndex === 3) return performWavelengthCalibration();
    if (state.settingsIndex === 4) return setDevice((device) => transitionToScreen(device, "version"));
    if (state.settingsIndex === 5) return resetAll();
  }
  if (action === "ESC") return setDevice((device) => transitionToScreen(device, "main"));
}

export function handleVersionScreen(state, action, actions) {
  const { setDevice } = actions;
  if (action === "ENTER" || action === "ESC") return setDevice((device) => transitionToScreen(device, "settings"));
}

export function handleWarningScreen(state, action, actions) {
  const { setDevice } = actions;
  if (action === "ESC" || action === "ENTER") {
    return setDevice((device) => transitionToScreen({ ...device, warning: null }, device.warningReturn));
  }
}

export function handleWarmupScreen(state, action, actions) {
  const { setDevice } = actions;
  if (action === "ESC" || action === "ENTER") return setDevice((device) => transitionToScreen(device, "main"));
}

export function handleInputScreen(state, action, actions) {
  const { setDevice, handleInputAction } = actions;
  if (action === "ESC") {
    return setDevice((device) => transitionToScreen(
      { ...device, inputBuffer: "", inputTarget: null, dialogTitle: "" },
      device.returnScreen || device.previousScreen || "main",
    ));
  }
  return handleInputAction(action);
}

export function handleSaveDialogScreen(state, action, actions) {
  const { setDevice, handleInputAction } = actions;
  if (action === "ESC") {
    return setDevice((device) => transitionToScreen(
      { ...device, inputBuffer: "", inputTarget: null, dialogTitle: "" },
      device.returnScreen || device.previousScreen || "main",
    ));
  }
  return handleInputAction(action);
}
