import { useCallback, useDebugValue, useEffect, useRef, useState } from "react";
import { CliService } from "../../application/services/CliService.js";
import { DeviceService } from "../../application/services/DeviceService.js";
import {
  handleCalibrationGraphScreen,
  handleCalibrationJournalScreen,
  handleCalibrationPlanScreen,
  handleCalibrationSetupParallelsScreen,
  handleCalibrationSetupStandardsScreen,
  handleCalibrationStepScreen,
  handleFileActionMenuScreen,
  handleFileListScreen,
  handleFileRootScreen,
  handleInputScreen,
  handleKineticsGraphScreen,
  handleKineticsMenuScreen,
  handleKineticsRunScreen,
  handleMainScreen,
  handleMultiWaveGraphScreen,
  handleMultiWaveJournalScreen,
  handleMultiWaveMenuScreen,
  handleMultiWaveRunScreen,
  handleMultiWaveSetupScreen,
  handlePhotometryGraphScreen,
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
import { transitionToScreen } from "../../application/services/screenFlow.js";
import { BOOT_DELAY_MS, DIAG_COMPLETE_DELAY_MS, DIAG_STEP_DELAY_MS, WARMUP_STEP_MS } from "../../domain/constants/index.js";
import {
  appendLogLine,
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
import { debugError, debugLog } from "../utils/debug.js";

export const SCREEN_HANDLER_REGISTRY = {
  warning: handleWarningScreen,
  warmup: handleWarmupScreen,
  input: handleInputScreen,
  saveDialog: handleSaveDialogScreen,
  main: handleMainScreen,
  fileRoot: handleFileRootScreen,
  fileList: handleFileListScreen,
  fileActionMenu: handleFileActionMenuScreen,
  photometry: handlePhotometryScreen,
  photometryGraph: handlePhotometryGraphScreen,
  photometryValue: handlePhotometryValueScreen,
  quantMain: handleQuantMainScreen,
  quantUnits: handleQuantUnitsScreen,
  quantCoef: handleQuantCoefScreen,
  calibrationSetupStandards: handleCalibrationSetupStandardsScreen,
  calibrationSetupParallels: handleCalibrationSetupParallelsScreen,
  calibrationPlan: handleCalibrationPlanScreen,
  calibrationStep: handleCalibrationStepScreen,
  calibrationJournal: handleCalibrationJournalScreen,
  calibrationGraph: handleCalibrationGraphScreen,
  kineticsMenu: handleKineticsMenuScreen,
  kineticsRun: handleKineticsRunScreen,
  kineticsGraph: handleKineticsGraphScreen,
  multiWaveMenu: handleMultiWaveMenuScreen,
  multiWaveSetup: handleMultiWaveSetupScreen,
  multiWaveRun: handleMultiWaveRunScreen,
  multiWaveJournal: handleMultiWaveJournalScreen,
  multiWaveGraph: handleMultiWaveGraphScreen,
  settings: handleSettingsScreen,
  version: handleVersionScreen,
};

export function useDeviceController(initialDeviceState = null, services = {}) {
  const deviceServiceRef = useRef(services.deviceService ?? new DeviceService());
  const cliServiceRef = useRef(services.cliService ?? new CliService());
  const [device, setDevice] = useState(() => (
    initialDeviceState
      ? { ...initialDevice(), ...initialDeviceState }
      : initialDevice()
  ));
  const [isPaused, setIsPaused] = useState(false);
  const [cliValue, setCliValue] = useState("help");
  const deviceRef = useRef(device);
  const kineticTimerRef = useRef(null);
  const kineticStartedAtRef = useRef(0);
  const kineticPausedAtRef = useRef(0);
  const kineticPausedTotalRef = useRef(0);
  const pausedRef = useRef(false);
  const selfTestsRanRef = useRef(false);

  useEffect(() => {
    deviceRef.current = device;
  }, [device]);

  useDebugValue({
    screen: device.screen,
    paused: isPaused,
    busy: device.busy,
    kineticRunning: Boolean(kineticTimerRef.current),
    multiWaveRuns: device.multiWaveMeasurements.length,
  });

  const stopKineticTimer = useCallback(() => {
    if (kineticTimerRef.current) clearInterval(kineticTimerRef.current);
    kineticTimerRef.current = null;
    kineticStartedAtRef.current = 0;
    kineticPausedAtRef.current = 0;
    kineticPausedTotalRef.current = 0;
  }, []);

  const logLine = useCallback((line) => {
    setDevice((current) => ({ ...current, logLines: appendLogLine(current.logLines, line) }));
  }, []);

  const showWarning = useCallback((title, body, warningReturn = "main") => {
    setDevice((current) => transitionToScreen(current, "warning", {
      warning: { title: String(title).toUpperCase(), body: String(body).toUpperCase() },
      warningReturn,
    }));
  }, []);

  const handleControllerError = useCallback((scope, error, warningReturn = null) => {
    const current = deviceRef.current;
    stopKineticTimer();
    debugError(scope, error, { screen: current.screen });
    logLine(`error: ${scope}`);
    showWarning("ОШИБКА", `${scope}: ${error?.message ?? "RUNTIME"}`, warningReturn ?? current.screen ?? "main");
  }, [logLine, showWarning, stopKineticTimer]);

  useEffect(() => {
    if (!selfTestsRanRef.current) {
      runSelfTests();
      selfTestsRanRef.current = true;
    }
  }, []);

  useEffect(() => {
    pausedRef.current = isPaused;
    if (!kineticTimerRef.current) return;
    if (isPaused) {
      kineticPausedAtRef.current = Date.now();
      return;
    }
    if (kineticPausedAtRef.current) {
      kineticPausedTotalRef.current += Date.now() - kineticPausedAtRef.current;
      kineticPausedAtRef.current = 0;
    }
  }, [isPaused]);

  const setBusy = useCallback(async (label, ms) => {
    if (pausedRef.current) return;
    setDevice((current) => ({ ...current, busy: true, busyLabel: label }));
    await new Promise((resolve) => setTimeout(resolve, ms));
    setDevice((current) => ({ ...current, busy: false, busyLabel: "ПОДОЖДИТЕ" }));
  }, []);

  const togglePauseSimulation = useCallback(() => {
    setIsPaused((current) => !current);
  }, []);

  const resetAll = useCallback(() => {
    stopKineticTimer();
    setIsPaused(false);
    setDevice(initialDevice());
  }, [stopKineticTimer]);

  const performRezero = useCallback(async () => {
    try {
      if (pausedRef.current) return;
      await setBusy("КАЛИБРОВКА НОЛЬ", 700);
      if (pausedRef.current) return;
      const result = deviceServiceRef.current.performRezero(deviceRef.current);
      setDevice(result.newState);
      logLine(result.logEntry);
      logLine("gain -> 1");
    } catch (error) {
      handleControllerError("performRezero", error);
    }
  }, [handleControllerError, logLine, setBusy]);

  const performPhotometryMeasure = useCallback(() => {
    try {
      if (pausedRef.current) return;
      const result = deviceServiceRef.current.performPhotometryMeasure(deviceRef.current);
      setDevice(result.newState);
      logLine(result.logEntry);
    } catch (error) {
      handleControllerError("performPhotometryMeasure", error);
    }
  }, [handleControllerError, logLine]);

  const performCalibrationMeasure = useCallback(() => {
    try {
      if (pausedRef.current) return;
      const result = deviceServiceRef.current.performCalibrationMeasure(deviceRef.current);
      setDevice(result.newState);
      logLine(result.logEntry);
    } catch (error) {
      handleControllerError("performCalibrationMeasure", error);
    }
  }, [handleControllerError, logLine]);

  const performDarkCurrent = useCallback(async () => {
    try {
      if (pausedRef.current) return;
      await setBusy("ТЕМНОВОЙ ТОК", 900);
      if (pausedRef.current) return;
      const result = deviceServiceRef.current.performDarkCurrent(deviceRef.current);
      setDevice(result.newState);
      logLine(result.logEntry);
    } catch (error) {
      handleControllerError("performDarkCurrent", error, "settings");
    }
  }, [handleControllerError, logLine, setBusy]);

  const performWavelengthCalibration = useCallback(async () => {
    try {
      if (pausedRef.current) return;
      await setBusy("КАЛИБРОВКА ЛЯМБДА", 1600);
      if (pausedRef.current) return;
      const result = deviceServiceRef.current.performWavelengthCalibration(deviceRef.current);
      setDevice(result.newState);
      logLine(result.logEntry);
      showWarning("УСПЕШНО", "КАЛИБРОВКА ВЫПОЛНЕНА", "settings");
    } catch (error) {
      handleControllerError("performWavelengthCalibration", error, "settings");
    }
  }, [handleControllerError, logLine, setBusy, showWarning]);

  const moveCalibrationCursor = useCallback((direction) => {
    if (pausedRef.current) return;
    setDevice((current) => {
      const { plan, resultCursor } = current.calibration;
      const measured = getCalibrationResultIndexes(plan);
      if (!measured.length) return current;
      const activeCursor = measured.includes(resultCursor) ? resultCursor : measured[measured.length - 1];
      if (direction === "up") {
        return { ...current, calibration: { ...current.calibration, resultCursor: findPrevMeasuredIndex(plan, activeCursor) } };
      }
      const next = findNextMeasuredIndex(plan, activeCursor);
      if (next === -1) {
        return transitionToScreen(
          { ...current, calibration: { ...current.calibration, resultCursor: activeCursor } },
          "calibrationGraph",
        );
      }
      return { ...current, calibration: { ...current.calibration, resultCursor: next } };
    });
  }, []);

  const nextCalibrationStep = useCallback(() => {
    if (pausedRef.current) return;
    setDevice((current) => {
      const nextIndex = findNextPendingStep(current.calibration.plan, current.calibration.stepIndex);
      if (nextIndex === -1) return transitionToScreen(current, "calibrationGraph");
      return transitionToScreen({ ...current, calibration: { ...current.calibration, stepIndex: nextIndex } }, "calibrationStep");
    });
  }, []);

  const remeasureCalibrationAtCursor = useCallback(() => {
    if (pausedRef.current) return;
    setDevice((current) => transitionToScreen(
      { ...current, calibration: { ...current.calibration, stepIndex: current.calibration.resultCursor } },
      "calibrationStep",
    ));
  }, []);

  const deleteCalibrationAtCursor = useCallback(() => {
    if (pausedRef.current) return;
    setDevice((current) => {
      const index = current.calibration.resultCursor;
      const plan = [...current.calibration.plan];
      const step = plan[index];
      if (!step?.result) return current;
      plan[index] = { ...step, result: null, status: "pending" };
      return transitionToScreen(
        { ...current, calibration: { ...current.calibration, plan, stepIndex: index, resultCursor: index } },
        "calibrationStep",
      );
    });
  }, []);

  const moveMultiWaveCursor = useCallback((direction) => {
    if (pausedRef.current) return;
    setDevice((current) => {
      const total = current.multiWaveMeasurements.length;
      if (!total) return current;
      if (direction === "up") {
        return { ...current, multiWaveMeasurementCursor: Math.max(0, current.multiWaveMeasurementCursor - 1) };
      }
      if (current.multiWaveMeasurementCursor >= total - 1) {
        return transitionToScreen(current, "multiWaveGraph");
      }
      return { ...current, multiWaveMeasurementCursor: Math.min(total - 1, current.multiWaveMeasurementCursor + 1) };
    });
  }, []);

  const startKinetics = useCallback(() => {
    try {
      if (pausedRef.current) return;
      stopKineticTimer();
      kineticStartedAtRef.current = Date.now();
      kineticPausedAtRef.current = 0;
      kineticPausedTotalRef.current = 0;
      setDevice((current) => transitionToScreen({ ...current, kineticPoints: [] }, "kineticsRun"));
      logLine("kinetics -> start");

      kineticTimerRef.current = setInterval(() => {
        try {
          if (pausedRef.current) return;
          setDevice((current) => {
            const elapsed = Date.now() - kineticStartedAtRef.current - kineticPausedTotalRef.current;
            const time = Math.floor(elapsed / 500);
            const measurement = measureSample({
              sample: "kinetic",
              wavelength: current.wavelength,
              gain: current.gain,
              e100: current.e100,
              darkValues: current.darkValues,
              timeSec: time,
            });

            const kineticPoints = [...current.kineticPoints, { time, value: measurement.a }];
            if (time >= current.kineticDuration) {
              stopKineticTimer();
            }

            return {
              ...current,
              kineticPoints,
              lastEnergy: measurement.energy,
              lastComputedA: measurement.a,
              lastComputedT: measurement.t,
            };
          });
        } catch (error) {
          handleControllerError("startKinetics.tick", error, "kineticsMenu");
        }
      }, 500);
    } catch (error) {
      handleControllerError("startKinetics", error, "kineticsMenu");
    }
  }, [handleControllerError, logLine, stopKineticTimer]);

  const stopKinetics = useCallback(() => {
    stopKineticTimer();
    logLine("kinetics -> stop");
    setDevice((current) => transitionToScreen(current, "kineticsMenu"));
  }, [logLine, stopKineticTimer]);

  const startMultiWave = useCallback(() => {
    if (pausedRef.current) return;
    debugLog("handleAction", "enter multiWaveRun");
    setDevice((current) => transitionToScreen(current, "multiWaveRun"));
  }, []);

  const performMultiWaveRun = useCallback(async () => {
    try {
      if (pausedRef.current) return;
      const current = deviceRef.current;
      const count = current.multiWaveCount;
      for (let index = 0; index < count; index += 1) {
        await setBusy(`ИЗМЕРЕНИЕ λ${index + 1}`, 140);
        if (pausedRef.current) return;
      }
      const result = deviceServiceRef.current.performMultiWaveMeasure(deviceRef.current);
      setDevice(result.newState);
      logLine(result.logEntry);
    } catch (error) {
      handleControllerError("performMultiWaveRun", error, "multiWaveRun");
    }
  }, [handleControllerError, logLine, setBusy]);

  useEffect(() => {
    return () => stopKineticTimer();
  }, [stopKineticTimer]);

  const openFileManager = useCallback((group, mode = "browse", previousScreen = "main") => {
    if (pausedRef.current) return;
    setDevice((current) => transitionToScreen(
      { ...current, previousScreen },
      previousScreen === "main" ? "fileRoot" : "fileList",
      { group, mode, fileListIndex: 0, keepPrevious: true },
    ));
  }, []);

  const openSaveDialog = useCallback((group, previousScreen) => {
    if (pausedRef.current) return;
    setDevice((current) => transitionToScreen(
      { ...current, previousScreen },
      "saveDialog",
      {
        saveMeta: { group, suggestedExt: fileExtByGroup(group) },
        returnScreen: previousScreen,
        keepPrevious: true,
      },
    ));
  }, []);

  const openRenameDialog = useCallback((currentName) => {
    if (pausedRef.current) return;
    setDevice((current) => transitionToScreen(current, "input", {
      inputTarget: "renameFile",
      inputBuffer: currentName,
      dialogTitle: "ПЕРЕИМЕНОВАТЬ",
      returnScreen: "fileActionMenu",
    }));
  }, []);

  const deleteFile = useCallback((group, index) => deviceServiceRef.current.deleteFile(deviceRef.current, group, index), []);
  const exportFile = useCallback((group, index) => deviceServiceRef.current.exportFile(deviceRef.current, group, index), []);

  const handleInputAction = useCallback((action) => {
    try {
      if (pausedRef.current) return;
      const current = deviceRef.current;

      if (/^[0-9A-Za-zА-Яа-я ]$/.test(action) || action === "." || action === "-" || action === "_") {
        setDevice((deviceState) => ({ ...deviceState, inputBuffer: `${deviceState.inputBuffer}${action}`.slice(0, 24) }));
        return;
      }

      if (action === "CLEAR") {
        setDevice((deviceState) => ({ ...deviceState, inputBuffer: deviceState.inputBuffer.slice(0, -1) }));
        return;
      }

      if (action !== "ENTER") return;

      const raw = parseFloat(current.inputBuffer || "0");

      if (current.inputTarget === "wavelength") {
        const result = deviceServiceRef.current.setWavelength(current, raw);
        if (result.error) return showWarning(result.error.title, result.error.body, result.error.returnScreen);
        setDevice(result.newState);
        if (result.logEntry) logLine(result.logEntry);
        return;
      }

      if (current.inputTarget === "quantK" || current.inputTarget === "quantB") {
        const result = deviceServiceRef.current.setQuantCoefficient(current, current.inputTarget === "quantK" ? "K" : "B", raw);
        if (result.error) return showWarning(result.error.title, result.error.body, "quantCoef");
        setDevice(result.newState);
        return;
      }

      if (current.inputTarget === "kinUpper" || current.inputTarget === "kinLower" || current.inputTarget === "kinDuration") {
        const typeMap = { kinUpper: "upper", kinLower: "lower", kinDuration: "duration" };
        const result = deviceServiceRef.current.setKineticParameter(current, typeMap[current.inputTarget], raw);
        if (result.error) return showWarning(result.error.title, result.error.body, "kineticsMenu");
        setDevice(result.newState);
        return;
      }

      if (current.inputTarget === "multiWaveCount") {
        const result = deviceServiceRef.current.setMultiWaveCount(current, raw);
        if (result.error) return showWarning(result.error.title, result.error.body, "multiWaveMenu");
        setDevice(result.newState);
        return;
      }

      if (current.inputTarget === "parallelCount") {
        const result = deviceServiceRef.current.setMultiWaveParallelCount(current, raw);
        if (result.error) return showWarning(result.error.title, result.error.body, "multiWaveMenu");
        setDevice(result.newState);
        return;
      }

      if (typeof current.inputTarget === "string" && current.inputTarget.startsWith("multiWaveWavelength_")) {
        const index = Number.parseInt(current.inputTarget.split("_").at(-1), 10);
        const result = deviceServiceRef.current.setMultiWaveWavelength(current, index, raw);
        if (result.error) return showWarning(result.error.title, result.error.body, "multiWaveSetup");
        setDevice(result.newState);
        if (result.logEntry) logLine(result.logEntry);
        return;
      }

      if (current.inputTarget === "saveName") {
        const result = deviceServiceRef.current.saveFile(current, current.inputBuffer);
        if (result.error) return showWarning(result.error.title, result.error.body, result.error.returnScreen);
        setDevice(result.newState);
        if (result.logEntry) logLine(result.logEntry);
        return;
      }

      if (current.inputTarget === "renameFile") {
        const result = deviceServiceRef.current.renameFile(current, current.fileContext.group, current.fileListIndex, current.inputBuffer);
        if (result.error) return showWarning(result.error.title, result.error.body, result.error.returnScreen);
        setDevice(result.newState);
      }
    } catch (error) {
      handleControllerError("handleInputAction", error);
    }
  }, [handleControllerError, logLine, showWarning]);

  const handleAction = useCallback((action) => {
    if (deviceRef.current.busy || pausedRef.current) return;

    const current = deviceRef.current;
    debugLog("handleAction", "screen:", current.screen, "action:", action);

    const actions = {
      setDevice,
      logLine,
      showWarning,
      performRezero,
      performPhotometryMeasure,
      performCalibrationMeasure,
      performDarkCurrent,
      performWavelengthCalibration,
      startKinetics,
      stopKinetics,
      startMultiWave,
      performMultiWaveRun,
      moveCalibrationCursor,
      nextCalibrationStep,
      remeasureCalibrationAtCursor,
      deleteCalibrationAtCursor,
      moveMultiWaveCursor,
      openFileManager,
      openSaveDialog,
      openRenameDialog,
      deleteFile,
      exportFile,
      handleInputAction,
      resetAll,
      buildCalibrationPlan,
    };

    const handler = SCREEN_HANDLER_REGISTRY[current.screen];
    if (!handler) return;

    try {
      return handler(current, action, actions);
    } catch (error) {
      handleControllerError(`handleAction.${current.screen}`, error, current.screen);
    }
  }, [
    deleteCalibrationAtCursor,
    deleteFile,
    exportFile,
    handleControllerError,
    handleInputAction,
    logLine,
    moveCalibrationCursor,
    moveMultiWaveCursor,
    nextCalibrationStep,
    openFileManager,
    openRenameDialog,
    openSaveDialog,
    performCalibrationMeasure,
    performDarkCurrent,
    performMultiWaveRun,
    performPhotometryMeasure,
    performRezero,
    performWavelengthCalibration,
    remeasureCalibrationAtCursor,
    resetAll,
    showWarning,
    startKinetics,
    startMultiWave,
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

      if (/^[0-9A-Za-zА-Яа-я ]$/.test(event.key) || event.key === "." || event.key === "-" || event.key === "_") {
        handleAction(event.key);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleAction]);

  useEffect(() => {
    if (isPaused) return undefined;
    if (device.screen !== "boot") return undefined;
    const bootTimer = setTimeout(() => setDevice((current) => transitionToScreen(current, "diagnostic")), BOOT_DELAY_MS);
    return () => clearTimeout(bootTimer);
  }, [device.screen, isPaused]);

  useEffect(() => {
    if (isPaused) return undefined;
    if (device.screen !== "diagnostic") return undefined;
    if (device.diagIndex >= 7) {
      const timer = setTimeout(() => setDevice((current) => transitionToScreen(current, "warmup")), DIAG_COMPLETE_DELAY_MS);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => setDevice((current) => ({ ...current, diagIndex: current.diagIndex + 1 })), DIAG_STEP_DELAY_MS);
    return () => clearTimeout(timer);
  }, [device.diagIndex, device.screen, isPaused]);

  useEffect(() => {
    if (isPaused) return undefined;
    if (device.screen !== "warmup") return undefined;

    const timer = setTimeout(() => {
      setDevice((current) => {
        if (current.warmupRemaining <= 1) return transitionToScreen({ ...current, warmupRemaining: 0 }, "main");
        return { ...current, warmupRemaining: current.warmupRemaining - 1 };
      });
    }, WARMUP_STEP_MS);

    return () => clearTimeout(timer);
  }, [device.screen, device.warmupRemaining, isPaused]);

  const executeCli = useCallback(async (command) => {
    try {
      if (pausedRef.current) return;
      await cliServiceRef.current.execute(command, deviceRef.current, logLine, setDevice, setBusy);
    } catch (error) {
      handleControllerError("executeCli", error, deviceRef.current.screen);
    }
  }, [handleControllerError, logLine, setBusy]);

  return {
    device,
    isPaused,
    togglePauseSimulation,
    setDevice,
    cliValue,
    setCliValue,
    handleAction,
    executeCli,
    resetAll,
    performRezero,
    performPhotometryMeasure,
    performDarkCurrent,
    performWavelengthCalibration,
    startKinetics,
    stopKinetics,
    startMultiWave,
    performMultiWaveRun,
    openFileManager,
    openSaveDialog,
    deleteFile,
    exportFile,
    showWarning,
    logLine,
  };
}

useDeviceController.displayName = "useDeviceController";
