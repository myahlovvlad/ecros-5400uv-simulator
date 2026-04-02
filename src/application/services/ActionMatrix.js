import {
  handleCalibrationJournalScreen,
  handleCalibrationPlanScreen,
  handleCalibrationSetupParallelsScreen,
  handleCalibrationSetupStandardsScreen,
  handleFileActionMenuScreen,
  handleFileListScreen,
  handleFileRootScreen,
  handleInputScreen,
  handleKineticsMenuScreen,
  handleKineticsRunScreen,
  handleMainScreen,
  handleMultiWlFormulaScreen,
  handleMultiWlMainScreen,
  handleMultiWlRunScreen,
  handlePhotometryScreen,
  handlePhotometryValueScreen,
  handleQuantMainScreen,
  handleQuantUnitsScreen,
  handleSaveDialogScreen,
  handleSettingsScreen,
  handleSettingsStatModeScreen,
  handleVersionScreen,
  handleWarningScreen,
  handleWarmupScreen,
} from "./ScreenHandlers.js";
import { TASK_STATES } from "../../domain/entities/workflowTypes.js";

export const SCREEN_HANDLER_MAP = {
  warning: handleWarningScreen,
  warmup: handleWarmupScreen,
  input: handleInputScreen,
  saveDialog: handleSaveDialogScreen,
  main: handleMainScreen,
  fileRoot: handleFileRootScreen,
  fileList: handleFileListScreen,
  fileActionMenu: handleFileActionMenuScreen,
  photometry: handlePhotometryScreen,
  photometryValue: handlePhotometryValueScreen,
  quantMain: handleQuantMainScreen,
  quantUnits: handleQuantUnitsScreen,
  calibrationSetupStandards: handleCalibrationSetupStandardsScreen,
  calibrationSetupParallels: handleCalibrationSetupParallelsScreen,
  calibrationPlan: handleCalibrationPlanScreen,
  calibrationJournal: handleCalibrationJournalScreen,
  kineticsMenu: handleKineticsMenuScreen,
  kineticsRun: handleKineticsRunScreen,
  multiwlMain: handleMultiWlMainScreen,
  multiwlFormula: handleMultiWlFormulaScreen,
  multiwlRun: handleMultiWlRunScreen,
  settings: handleSettingsScreen,
  settingsStatMode: handleSettingsStatModeScreen,
  version: handleVersionScreen,
};

function openWavelengthInput(returnScreen, setDevice) {
  return setDevice((d) => ({
    ...d,
    screen: "input",
    inputTarget: "wavelength",
    inputBuffer: `${d.wavelength.toFixed(1)}`,
    dialogTitle: "ВВЕДИТЕ ЛЯМ, НМ",
    returnScreen,
  }));
}

export const SCREEN_ACTION_MATRIX = {
  photometryGraph: {
    ESC: (state, { setDevice }) => setDevice((d) => ({ ...d, screen: "photometry" })),
  },
  kineticsGraph: {
    ESC: (state, { setDevice }) => setDevice((d) => ({ ...d, screen: "kineticsRun" })),
  },
  quantCoef: {
    ZERO: (state, { performRezero }) => performRezero(),
    GOTOλ: (state, { setDevice }) => openWavelengthInput("quantCoef", setDevice),
    SET: (state, { showWarning }) => showWarning("РЕДАКТИР.", "1=К 2=Б 3=N", "quantCoef"),
    "1": (state, { setDevice }) =>
      setDevice((d) => ({ ...d, screen: "input", inputTarget: "quantK", inputBuffer: String(d.quantK), dialogTitle: "ВВЕДИТЕ К", returnScreen: "quantCoef" })),
    "2": (state, { setDevice }) =>
      setDevice((d) => ({ ...d, screen: "input", inputTarget: "quantB", inputBuffer: String(d.quantB), dialogTitle: "ВВЕДИТЕ Б", returnScreen: "quantCoef" })),
    "3": (state, { setDevice }) =>
      setDevice((d) => ({ ...d, screen: "input", inputTarget: "quantCoefReplicates", inputBuffer: String(d.quantCoefContext?.unknownReplicates ?? 1), dialogTitle: "ПОВТ. ПРОБ", returnScreen: "quantCoef" })),
    FILE: (state, { openSaveDialog }) => openSaveDialog("КОЭФФИЦИЕНТ", "quantCoef"),
    ESC: (state, { setDevice }) => setDevice((d) => ({ ...d, screen: "quantMain", taskState: TASK_STATES.IDLE })),
    "START/STOP": (state, { toggleCoefPause, performQuantCoefMeasure }) => {
      if (state.taskState === TASK_STATES.RUNNING && (state.quantCoefContext?.currentUnknownReplicate ?? 0) > 0) return toggleCoefPause();
      return performQuantCoefMeasure();
    },
    ENTER: (state, { performQuantCoefMeasure }) => performQuantCoefMeasure(),
  },
  quantCoefPaused: {
    "START/STOP": (state, { toggleCoefPause }) => toggleCoefPause(),
    FILE: (state, { openSaveDialog }) => openSaveDialog("КОЭФФИЦИЕНТ", "quantCoefPaused"),
    ESC: (state, { setDevice }) => setDevice((d) => ({ ...d, screen: "quantCoef" })),
  },
  quantCoefNext: {
    "START/STOP": (state, { nextCoefSample }) => nextCoefSample(),
    ENTER: (state, { nextCoefSample }) => nextCoefSample(),
    FILE: (state, { openSaveDialog }) => openSaveDialog("КОЭФФИЦИЕНТ", "quantCoefNext"),
    ESC: (state, { setDevice }) => setDevice((d) => ({ ...d, screen: "quantCoef", taskState: TASK_STATES.READY })),
  },
  calibrationStep: {
    ZERO: (state, { performRezero }) => performRezero(),
    FILE: (state, { openSaveDialog }) => openSaveDialog("ГРАДУИРОВКА", "calibrationStep"),
    ESC: (state, { setDevice }) => setDevice((d) => ({ ...d, screen: "calibrationPlan" })),
    "START/STOP": (state, { setDevice, performCalibrationMeasure }) => {
      const step = state.calibration.plan[state.calibration.stepIndex];
      const concentration = state.calibration.standardConcentrations?.[step?.standardIndex - 1];
      if (!Number.isFinite(concentration)) {
        return setDevice((d) => ({
          ...d,
          screen: "input",
          inputTarget: "calibrationConcentration",
          inputBuffer: "",
          dialogTitle: `КОНЦ. С-${step?.standardIndex ?? 1}`,
          returnScreen: "calibrationStep",
        }));
      }
      return performCalibrationMeasure();
    },
    ENTER: (state, actions) => SCREEN_ACTION_MATRIX.calibrationStep["START/STOP"](state, actions),
  },
  calibrationGraph: {
    FILE: (state, { openSaveDialog }) => openSaveDialog("ГРАДУИРОВКА", "calibrationGraph"),
    ESC: (state, { setDevice }) => setDevice((d) => ({ ...d, screen: "calibrationJournal" })),
    ENTER: (state, { startCalibrationUnknownSeries }) => startCalibrationUnknownSeries(),
    DOWN: (state, { startCalibrationUnknownSeries }) => startCalibrationUnknownSeries(),
  },
  calibrationUnknown: {
    ZERO: (state, { performRezero }) => performRezero(),
    FILE: (state, { openSaveDialog }) => openSaveDialog("ГРАДУИРОВКА", "calibrationUnknown"),
    ESC: (state, { setDevice }) => setDevice((d) => ({ ...d, screen: "calibrationGraph" })),
    ENTER: (state, { performCalibrationUnknownMeasure }) => performCalibrationUnknownMeasure(),
    "START/STOP": (state, { performCalibrationUnknownMeasure }) => performCalibrationUnknownMeasure(),
  },
  calibrationUnknownNext: {
    FILE: (state, { openSaveDialog }) => openSaveDialog("ГРАДУИРОВКА", "calibrationUnknownNext"),
    ESC: (state, { setDevice }) => setDevice((d) => ({ ...d, screen: "calibrationGraph" })),
    ENTER: (state, { nextUnknownSample }) => nextUnknownSample(),
    "START/STOP": (state, { nextUnknownSample }) => nextUnknownSample(),
  },
};
