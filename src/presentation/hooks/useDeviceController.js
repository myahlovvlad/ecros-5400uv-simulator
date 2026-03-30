import { useCallback, useEffect, useRef, useState } from "react";
import { CliService } from "../../application/services/CliService.js";
import { DeviceService } from "../../application/services/DeviceService.js";
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
  handleMultiwaveMenuScreen,
  handleMultiwaveResultsScreen,
  handleMultiwaveValueScreen,
  handleMultiwaveWaveCountScreen,
  handleMultiwaveWaveEntryScreen,
  handlePhotometryScreen,
  handlePhotometryValueScreen,
  handleQuantCoefScreen,
  handleQuantMainScreen,
  handleQuantUnitsScreen,
  handleSaveDialogScreen,
  handleSettingsScreen,
  handleVersionScreen,
  handleWarningScreen,
  handleWarmupScreen,
} from "../../application/services/ScreenHandlers.js";
import { BOOT_DELAY_MS, DIAG_COMPLETE_DELAY_MS, DIAG_STEP_DELAY_MS, WARMUP_STEP_MS } from "../../domain/constants/index.js";
import {
  buildCalibrationPlan,
  fileExtByGroup,
  findNextMeasuredIndex,
  findNextPendingStep,
  findPrevMeasuredIndex,
  getCalibrationResultIndexes,
  initialDevice,
  measureSample,
  runSelfTests,
} from "../../domain/usecases/index.js";

const deviceService = new DeviceService();
const cliService = new CliService();
const INPUT_CHAR_RE = /^[0-9A-Za-zА-Яа-яЁё ]$/;

export function useDeviceController() {
  const [device, setDevice] = useState(initialDevice);
  const [cliValue, setCliValue] = useState("help");
  const kineticTimerRef = useRef(null);
  const kineticStartedAtRef = useRef(0);
  const kineticPausedAtRef = useRef(null);
  const kineticPausedMsRef = useRef(0);
  const selfTestsRanRef = useRef(false);

  useEffect(() => {
    if (!selfTestsRanRef.current) {
      runSelfTests();
      selfTestsRanRef.current = true;
    }
  }, []);

  const logLine = useCallback((line) => {
    setDevice((d) => ({ ...d, logLines: [...d.logLines.slice(-180), line] }));
  }, []);

  const setBusy = useCallback(async (label, ms) => {
    setDevice((d) => ({ ...d, busy: true, busyLabel: label }));
    await new Promise((resolve) => setTimeout(resolve, ms));
    setDevice((d) => ({ ...d, busy: false, busyLabel: "ПОДОЖДИТЕ" }));
  }, []);

  const showWarning = useCallback((title, body, warningReturn = "main") => {
    setDevice((d) => ({
      ...d,
      screen: "warning",
      warning: { title: String(title).toUpperCase(), body: String(body).toUpperCase() },
      warningReturn,
    }));
  }, []);

  const resetAll = useCallback(() => {
    if (kineticTimerRef.current) clearInterval(kineticTimerRef.current);
    kineticTimerRef.current = null;
    kineticStartedAtRef.current = 0;
    kineticPausedAtRef.current = null;
    kineticPausedMsRef.current = 0;
    setDevice(initialDevice());
  }, []);

  const performRezero = useCallback(async () => {
    await setBusy("КАЛИБРОВКА НОЛЬ", 700);
    const result = deviceService.performRezero(device);
    setDevice(result.newState);
    logLine(result.logEntry);
    logLine("gain -> 1");
  }, [device, logLine, setBusy]);

  const performPhotometryMeasure = useCallback(() => {
    const result = deviceService.performPhotometryMeasure(device);
    setDevice(result.newState);
    logLine(result.logEntry);
  }, [device, logLine]);

  const performCalibrationMeasure = useCallback(() => {
    const result = deviceService.performCalibrationMeasure(device);
    setDevice(result.newState);
    logLine(result.logEntry);
  }, [device, logLine]);

  const performMultiwaveMeasure = useCallback(() => {
    const result = deviceService.performMultiwaveMeasure(device);
    if (result.error) {
      showWarning(result.error.title, result.error.body, result.error.returnScreen);
      return;
    }
    setDevice({ ...result.newState, screen: "multiwaveResults" });
    logLine(result.logEntry);
  }, [device, logLine, showWarning]);

  const performDarkCurrent = useCallback(async () => {
    await setBusy("ТЕМНОВОЙ ТОК", 900);
    const result = deviceService.performDarkCurrent(device);
    setDevice(result.newState);
    logLine(result.logEntry);
  }, [device, logLine, setBusy]);

  const performWavelengthCalibration = useCallback(async () => {
    await setBusy("КАЛИБРОВКА ЛЯМБДА", 1600);
    const result = deviceService.performWavelengthCalibration(device);
    setDevice(result.newState);
    logLine(result.logEntry);
    showWarning("УСПЕШНО", "КАЛИБРОВКА ВЫПОЛНЕНА", "settings");
  }, [device, logLine, setBusy, showWarning]);

  const setMultiwaveValueMode = useCallback((valueIndex) => {
    const result = deviceService.setMultiwaveValueMode(device, valueIndex);
    setDevice(result.newState);
  }, [device]);

  const moveCalibrationCursor = useCallback((direction) => {
    setDevice((d) => {
      const { plan, resultCursor } = d.calibration;
      const measured = getCalibrationResultIndexes(plan);
      if (!measured.length) return d;
      const current = measured.includes(resultCursor) ? resultCursor : measured[measured.length - 1];
      if (direction === "up") {
        return { ...d, calibration: { ...d.calibration, resultCursor: findPrevMeasuredIndex(plan, current) } };
      }
      const next = findNextMeasuredIndex(plan, current);
      if (next === -1) return { ...d, calibration: { ...d.calibration, resultCursor: current }, screen: "calibrationGraph" };
      return { ...d, calibration: { ...d.calibration, resultCursor: next } };
    });
  }, []);

  const nextCalibrationStep = useCallback(() => {
    setDevice((d) => {
      const nextIndex = findNextPendingStep(d.calibration.plan, d.calibration.stepIndex);
      if (nextIndex === -1) return { ...d, screen: "calibrationGraph" };
      return { ...d, calibration: { ...d.calibration, stepIndex: nextIndex }, screen: "calibrationStep" };
    });
  }, []);

  const remeasureCalibrationAtCursor = useCallback(() => {
    setDevice((d) => ({ ...d, calibration: { ...d.calibration, stepIndex: d.calibration.resultCursor }, screen: "calibrationStep" }));
  }, []);

  const deleteCalibrationAtCursor = useCallback(() => {
    setDevice((d) => {
      const index = d.calibration.resultCursor;
      const plan = [...d.calibration.plan];
      const step = plan[index];
      if (!step?.result) return d;
      plan[index] = { ...step, result: null, status: "pending" };
      return { ...d, calibration: { ...d.calibration, plan, stepIndex: index, resultCursor: index }, screen: "calibrationStep" };
    });
  }, []);

  const beginKineticsInterval = useCallback(() => {
    if (kineticTimerRef.current) clearInterval(kineticTimerRef.current);

    kineticTimerRef.current = setInterval(() => {
      setDevice((d) => {
        if (d.emulatorPaused) return d;

        const elapsedMs = Date.now() - kineticStartedAtRef.current - kineticPausedMsRef.current;
        const time = Math.floor(elapsedMs / 500);
        const lastTime = d.kineticPoints.at(-1)?.time ?? -1;
        if (time <= lastTime) return d;

        const measurement = measureSample({
          sample: "kinetic",
          wavelength: d.wavelength,
          gain: d.gain,
          e100: d.e100,
          darkValues: d.darkValues,
          timeSec: time,
        });

        const kineticPoints = [...d.kineticPoints, { time, value: measurement.a }];
        if (time >= d.kineticDuration) {
          clearInterval(kineticTimerRef.current);
          kineticTimerRef.current = null;
        }

        return {
          ...d,
          kineticPoints,
          lastEnergy: measurement.energy,
          lastComputedA: measurement.a,
          lastComputedT: measurement.t,
        };
      });
    }, 500);
  }, []);

  const startKinetics = useCallback(() => {
    if (kineticTimerRef.current) clearInterval(kineticTimerRef.current);
    kineticStartedAtRef.current = Date.now();
    kineticPausedAtRef.current = null;
    kineticPausedMsRef.current = 0;
    setDevice((d) => ({ ...d, kineticPoints: [], screen: "kineticsRun" }));
    if (!device.emulatorPaused) beginKineticsInterval();
  }, [beginKineticsInterval, device.emulatorPaused]);

  const stopKinetics = useCallback(() => {
    if (kineticTimerRef.current) clearInterval(kineticTimerRef.current);
    kineticTimerRef.current = null;
    kineticStartedAtRef.current = 0;
    kineticPausedAtRef.current = null;
    kineticPausedMsRef.current = 0;
    setDevice((d) => ({ ...d, screen: "kineticsMenu" }));
  }, []);

  const togglePause = useCallback(() => {
    const nextPaused = !device.emulatorPaused;

    if (nextPaused) {
      kineticPausedAtRef.current = Date.now();
      if (kineticTimerRef.current) {
        clearInterval(kineticTimerRef.current);
        kineticTimerRef.current = null;
      }
    } else {
      if (kineticPausedAtRef.current != null) {
        kineticPausedMsRef.current += Date.now() - kineticPausedAtRef.current;
        kineticPausedAtRef.current = null;
      }
      if (device.screen === "kineticsRun") beginKineticsInterval();
    }

    setDevice((d) => ({ ...d, emulatorPaused: nextPaused }));
  }, [beginKineticsInterval, device.emulatorPaused, device.screen]);

  useEffect(() => {
    return () => {
      if (kineticTimerRef.current) clearInterval(kineticTimerRef.current);
    };
  }, []);

  const openFileManager = useCallback((group, mode = "browse", previousScreen = "main") => {
    setDevice((d) => ({
      ...d,
      previousScreen,
      fileContext: { group, mode },
      fileListIndex: 0,
      screen: previousScreen === "main" ? "fileRoot" : "fileList",
    }));
  }, []);

  const openSaveDialog = useCallback((group, previousScreen) => {
    setDevice((d) => ({
      ...d,
      screen: "saveDialog",
      previousScreen,
      saveMeta: { group, suggestedExt: fileExtByGroup(group) },
      inputTarget: "saveName",
      inputBuffer: "",
    }));
  }, []);

  const openRenameDialog = useCallback((currentName) => {
    setDevice((d) => ({
      ...d,
      screen: "input",
      inputTarget: "renameFile",
      inputBuffer: currentName,
      dialogTitle: "ПЕРЕИМЕНОВАТЬ",
      returnScreen: "fileActionMenu",
    }));
  }, []);

  const deleteFile = useCallback((group, index) => deviceService.deleteFile(device, group, index), [device]);
  const openFile = useCallback((group, index) => deviceService.openFile(device, group, index), [device]);
  const exportFile = useCallback((group, index) => deviceService.exportFile(device, group, index), [device]);

  const handleInputAction = useCallback((action) => {
    if (INPUT_CHAR_RE.test(action) || action === "." || action === "-" || action === "_") {
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
      const result = deviceService.setWavelength(device, raw);
      if (result.error) return showWarning(result.error.title, result.error.body, result.error.returnScreen);
      setDevice(result.newState);
      logLine(result.logEntry);
      return;
    }

    if (device.inputTarget === "multiwaveCount") {
      const result = deviceService.setMultiwaveCount(device, raw);
      if (result.error) return showWarning(result.error.title, result.error.body, result.error.returnScreen);
      setDevice(result.newState);
      logLine(result.logEntry);
      return;
    }

    if (/^multiwaveWavelength[0-3]$/.test(device.inputTarget || "")) {
      const slot = Number(device.inputTarget.replace("multiwaveWavelength", ""));
      const result = deviceService.setMultiwaveWavelength(device, slot, raw);
      if (result.error) return showWarning(result.error.title, result.error.body, result.error.returnScreen);
      setDevice(result.newState);
      logLine(result.logEntry);
      return;
    }

    if (device.inputTarget === "quantK" || device.inputTarget === "quantB") {
      const result = deviceService.setQuantCoefficient(device, device.inputTarget === "quantK" ? "K" : "B", raw);
      if (result.error) return showWarning(result.error.title, result.error.body, "quantCoef");
      setDevice(result.newState);
      return;
    }

    if (device.inputTarget === "quantCuvetteLengthMm") {
      const result = deviceService.setQuantCuvetteLengthMm(device, raw);
      if (result.error) return showWarning(result.error.title, result.error.body, result.error.returnScreen);
      setDevice(result.newState);
      logLine(result.logEntry);
      return;
    }

    if (device.inputTarget === "kinUpper" || device.inputTarget === "kinLower" || device.inputTarget === "kinDuration") {
      const typeMap = { kinUpper: "upper", kinLower: "lower", kinDuration: "duration" };
      const result = deviceService.setKineticParameter(device, typeMap[device.inputTarget], raw);
      if (result.error) return showWarning(result.error.title, result.error.body, "kineticsMenu");
      setDevice(result.newState);
      return;
    }

    if (device.inputTarget === "saveName") {
      const result = deviceService.saveFile(device, device.inputBuffer);
      if (result.error) return showWarning(result.error.title, result.error.body, result.error.returnScreen);
      setDevice(result.newState);
      logLine(result.logEntry);
      return;
    }

    if (device.inputTarget === "renameFile") {
      const result = deviceService.renameFile(device, device.fileContext.group, device.fileListIndex, device.inputBuffer);
      if (result.error) return showWarning(result.error.title, result.error.body, result.error.returnScreen);
      setDevice(result.newState);
    }
  }, [device, logLine, showWarning]);

  const handleAction = useCallback((action) => {
    if (device.busy || device.emulatorPaused) return;

    if (action === "PRINT") {
      logLine("print -> not-configured");
      showWarning("ПЕЧАТЬ", "ПЕЧАТЬ НЕ НАСТРОЕНА", device.screen);
      return;
    }

    const actions = {
      setDevice,
      logLine,
      showWarning,
      performRezero,
      performPhotometryMeasure,
      performCalibrationMeasure,
      performMultiwaveMeasure,
      performDarkCurrent,
      performWavelengthCalibration,
      startKinetics,
      stopKinetics,
      moveCalibrationCursor,
      nextCalibrationStep,
      remeasureCalibrationAtCursor,
      deleteCalibrationAtCursor,
      openFileManager,
      openSaveDialog,
      openRenameDialog,
      openFile,
      deleteFile,
      exportFile,
      handleInputAction,
      resetAll,
      buildCalibrationPlan,
      setMultiwaveValueMode,
    };

    switch (device.screen) {
      case "warning":
        return handleWarningScreen(device, action, actions);
      case "warmup":
        return handleWarmupScreen(device, action, actions);
      case "input":
        return handleInputScreen(device, action, actions);
      case "saveDialog":
        return handleSaveDialogScreen(device, action, actions);
      case "main":
        return handleMainScreen(device, action, actions);
      case "fileRoot":
        return handleFileRootScreen(device, action, actions);
      case "fileList":
        return handleFileListScreen(device, action, actions);
      case "fileActionMenu":
        return handleFileActionMenuScreen(device, action, actions);
      case "photometry":
        return handlePhotometryScreen(device, action, actions);
      case "photometryGraph":
        if (action === "ESC") return setDevice((d) => ({ ...d, screen: "photometry" }));
        return;
      case "photometryValue":
        return handlePhotometryValueScreen(device, action, actions);
      case "quantMain":
        return handleQuantMainScreen(device, action, actions);
      case "quantUnits":
        return handleQuantUnitsScreen(device, action, actions);
      case "quantCoef":
        return handleQuantCoefScreen(device, action, actions);
      case "calibrationSetupStandards":
        return handleCalibrationSetupStandardsScreen(device, action, actions);
      case "calibrationSetupParallels":
        return handleCalibrationSetupParallelsScreen(device, action, actions);
      case "calibrationPlan":
        return handleCalibrationPlanScreen(device, action, actions);
      case "calibrationStep":
        return handleCalibrationStepScreen(device, action, actions);
      case "calibrationJournal":
        return handleCalibrationJournalScreen(device, action, actions);
      case "calibrationGraph":
        if (action === "FILE") return openSaveDialog("ГРАДУИРОВКА", "calibrationGraph");
        if (action === "ESC") return setDevice((d) => ({ ...d, screen: "calibrationJournal" }));
        return;
      case "kineticsMenu":
        return handleKineticsMenuScreen(device, action, actions);
      case "kineticsRun":
        return handleKineticsRunScreen(device, action, actions);
      case "kineticsGraph":
        if (action === "ESC") return setDevice((d) => ({ ...d, screen: "kineticsRun" }));
        return;
      case "multiwaveMenu":
        return handleMultiwaveMenuScreen(device, action, actions);
      case "multiwaveWaveCount":
        return handleMultiwaveWaveCountScreen(device, action, actions);
      case "multiwaveWaveEntry":
        return handleMultiwaveWaveEntryScreen(device, action, actions);
      case "multiwaveValue":
        return handleMultiwaveValueScreen(device, action, actions);
      case "multiwaveResults":
        return handleMultiwaveResultsScreen(device, action, actions);
      case "settings":
        return handleSettingsScreen(device, action, actions);
      case "version":
        return handleVersionScreen(device, action, actions);
      default:
        return;
    }
  }, [
    buildCalibrationPlan,
    deleteCalibrationAtCursor,
    deleteFile,
    device,
    exportFile,
    handleInputAction,
    logLine,
    moveCalibrationCursor,
    nextCalibrationStep,
    openFileManager,
    openFile,
    openRenameDialog,
    openSaveDialog,
    performCalibrationMeasure,
    performDarkCurrent,
    performMultiwaveMeasure,
    performPhotometryMeasure,
    performRezero,
    performWavelengthCalibration,
    remeasureCalibrationAtCursor,
    resetAll,
    setMultiwaveValueMode,
    showWarning,
    startKinetics,
    stopKinetics,
  ]);

  useEffect(() => {
    const handler = (event) => {
      const keyMap = { Enter: "ENTER", Escape: "ESC", ArrowUp: "UP", ArrowDown: "DOWN" };
      if (keyMap[event.key]) {
        event.preventDefault();
        handleAction(keyMap[event.key]);
        return;
      }

      if (INPUT_CHAR_RE.test(event.key) || event.key === "." || event.key === "-" || event.key === "_") {
        handleAction(event.key);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleAction]);

  useEffect(() => {
    const bootTimer = setTimeout(() => setDevice((d) => ({ ...d, screen: "diagnostic" })), BOOT_DELAY_MS);
    return () => clearTimeout(bootTimer);
  }, []);

  useEffect(() => {
    if (device.screen !== "diagnostic") return undefined;
    if (device.emulatorPaused) return undefined;
    if (device.diagIndex >= 7) {
      const timer = setTimeout(() => setDevice((d) => ({ ...d, screen: "warmup" })), DIAG_COMPLETE_DELAY_MS);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => setDevice((d) => ({ ...d, diagIndex: d.diagIndex + 1 })), DIAG_STEP_DELAY_MS);
    return () => clearTimeout(timer);
  }, [device.diagIndex, device.emulatorPaused, device.screen]);

  useEffect(() => {
    if (device.screen !== "warmup") return undefined;
    if (device.emulatorPaused) return undefined;

    const timer = setTimeout(() => {
      setDevice((d) => {
        if (d.warmupRemaining <= 1) return { ...d, screen: "main", warmupRemaining: 0 };
        return { ...d, warmupRemaining: d.warmupRemaining - 1 };
      });
    }, WARMUP_STEP_MS);

    return () => clearTimeout(timer);
  }, [device.emulatorPaused, device.screen, device.warmupRemaining]);

  const executeCli = useCallback(async (command) => {
    if (device.emulatorPaused) return;
    await cliService.execute(command, device, logLine, setDevice, setBusy);
  }, [device, logLine, setBusy]);

  return {
    device,
    setDevice,
    cliValue,
    setCliValue,
    handleAction,
    executeCli,
    resetAll,
    performRezero,
    performPhotometryMeasure,
    performMultiwaveMeasure,
    togglePause,
    performDarkCurrent,
    performWavelengthCalibration,
    startKinetics,
    stopKinetics,
    openFileManager,
    openSaveDialog,
    deleteFile,
    exportFile,
    showWarning,
    logLine,
  };
}
