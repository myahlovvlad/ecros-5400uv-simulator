import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DeviceProvider, useDevice } from "../contexts/DeviceContext.jsx";
import { AppHeader } from "./AppHeader.jsx";
import { CliEmulator } from "./CliEmulator.jsx";
import { DeviceMetricsCard, VirtualSampleCard } from "./DeviceStatus.jsx";
import { DisplayToolsCard } from "./DisplayToolsCard.jsx";
import {
  InstrumentPanel,
  PANEL_LABEL_DEFAULTS,
  DEFAULT_PANEL_ELEMENT_LAYOUT,
  normalizePanelElementLayout,
  updatePanelSelectionGeometry,
  alignPanelSelection,
  hidePanelElements,
} from "./InstrumentPanel.jsx";
import { LcdTextEditor, normalizeLcdRows } from "./LcdTextEditor.jsx";
import { MeasurementTable } from "./MeasurementTable.jsx";
import { NavigationInfo } from "./NavigationInfo.jsx";
import { CCodeGeneratorCard, PanelLabelEditorCard } from "./PanelLabelEditor.jsx";
import { PanelLayoutEditorCard, DEFAULT_PANEL_LAYOUT } from "./PanelLayoutEditorCard.jsx";
import { ScenarioFlowMap } from "./ScenarioFlowMap.jsx";
import { UsbExportPanel } from "./UsbExportPanel.jsx";
import { WindowWorkspace, normalizeWindowLayout } from "./WindowWorkspace.jsx";
import { transitionToScreen } from "../../application/services/screenFlow.js";
import { getLcdRows } from "../../infrastructure/adapters/LcdRenderer.js";
import {
  buildCalibrationPlan,
  initialDevice,
  measureSample,
  normalizeLogLine,
  normalizeMultiWaveWavelengths,
} from "../../domain/usecases/index.js";

const WORKSPACE_PREFS_KEY = "ecros_workspace_prefs_v2";

const DEFAULT_WINDOWS = [
  { id: "instrumentPanel", title: "Панель симулятора", x: 20, y: 20, w: 980, h: 900 },
  { id: "displayTools", title: "Инструменты дисплея", x: 1030, y: 20, w: 420, h: 500 },
  { id: "lcdEditor", title: "Редактор LCD", x: 1470, y: 20, w: 420, h: 560 },
  { id: "cli", title: "CLI-эмулятор", x: 1030, y: 540, w: 420, h: 420 },
  { id: "usb", title: "USB-накопитель", x: 1470, y: 600, w: 420, h: 260 },
  { id: "navigation", title: "Навигация и аудит UI", x: 20, y: 950, w: 420, h: 420 },
  { id: "labelEditor", title: "Редактор надписей", x: 460, y: 950, w: 420, h: 520 },
  { id: "cCode", title: "Генератор C-кода", x: 900, y: 980, w: 520, h: 420 },
  { id: "deviceState", title: "Состояние прибора", x: 20, y: 1310, w: 340, h: 260 },
  { id: "virtualSample", title: "Виртуальный образец", x: 380, y: 1310, w: 520, h: 320 },
  { id: "results", title: "Последние результаты", x: 20, y: 1600, w: 860, h: 360 },
  { id: "scenarioFlow", title: "Ветки сценариев", x: 900, y: 1430, w: 760, h: 620 },
  { id: "panelLayout", title: "Геометрия панели", x: 1910, y: 20, w: 360, h: 520 },
];

function normalizeMode(mode) {
  return mode === "edit" ? "canvas" : mode;
}

function loadWorkspacePrefs() {
  if (typeof window === "undefined") return null;
  try {
    const saved = window.localStorage.getItem(WORKSPACE_PREFS_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return {
      ...parsed,
      mode: normalizeMode(parsed.mode ?? "simulation"),
    };
  } catch (error) {
    console.error("Failed to load workspace preferences:", error);
    return null;
  }
}

function getPersistedDeviceState(device) {
  return {
    ...device,
    busy: false,
    busyLabel: initialDevice().busyLabel,
  };
}

function restorePersistedDeviceState(snapshot, fallbackScreen = null) {
  if (!snapshot || typeof snapshot !== "object") {
    return fallbackScreen
      ? transitionToScreen(initialDevice(), fallbackScreen, { previousScreen: fallbackScreen })
      : null;
  }

  const base = initialDevice();
  const next = {
    ...base,
    ...snapshot,
    busy: false,
    busyLabel: base.busyLabel,
    logLines: Array.isArray(snapshot.logLines) ? snapshot.logLines.map(normalizeLogLine) : base.logLines,
    fileContext: { ...base.fileContext, ...(snapshot.fileContext ?? {}) },
    saveMeta: { ...base.saveMeta, ...(snapshot.saveMeta ?? {}) },
    calibration: { ...base.calibration, ...(snapshot.calibration ?? {}) },
  };

  const standards = Math.max(1, Math.min(9, Number(next.calibration.standards) || base.calibration.standards));
  const parallels = Math.max(1, Math.min(9, Number(next.calibration.parallels) || base.calibration.parallels));
  next.calibration.standards = standards;
  next.calibration.parallels = parallels;
  next.calibration.plan = Array.isArray(snapshot.calibration?.plan) && snapshot.calibration.plan.length
    ? snapshot.calibration.plan
    : buildCalibrationPlan(standards, parallels);
  next.multiWaveCount = Math.max(1, Math.min(5, Number(snapshot.multiWaveCount) || base.multiWaveCount));
  next.multiWaveParallelCount = Math.max(1, Math.min(5, Number(snapshot.multiWaveParallelCount) || base.multiWaveParallelCount));
  next.multiWaveWavelengths = normalizeMultiWaveWavelengths(snapshot.multiWaveWavelengths, 5);
  next.multiWaveMeasurements = Array.isArray(snapshot.multiWaveMeasurements) ? snapshot.multiWaveMeasurements : [];
  next.multiWaveGraphData = Array.isArray(snapshot.multiWaveGraphData) ? snapshot.multiWaveGraphData : [];
  next.multiWaveMeasurementCursor = Math.max(0, Math.min(next.multiWaveMeasurements.length - 1, Number(snapshot.multiWaveMeasurementCursor) || 0));

  if (typeof fallbackScreen === "string" && !snapshot.screen) {
    return transitionToScreen(next, fallbackScreen, { previousScreen: fallbackScreen });
  }

  return next;
}

function serializeWorkspacePrefs({
  deviceState,
  mode,
  currentScreen,
  panelLabels,
  panelElementLayout,
  lcdEditorEnabled,
  lcdEditorMode,
  lcdEditorRows,
  displayPresets,
  panelLayout,
  windows,
}) {
  return JSON.stringify({
    deviceState,
    mode,
    currentScreen,
    panelLabels,
    panelElementLayout,
    lcdEditorEnabled,
    lcdEditorMode,
    lcdEditorRows,
    displayPresets,
    panelLayout,
    windows: windows.map(({ id, x, y, w, h, z, collapsed }) => ({ id, x, y, w, h, z, collapsed })),
  });
}

function AppContent() {
  const {
    device,
    isPaused,
    togglePauseSimulation,
    setDevice,
    handleAction,
    executeCli,
    resetAll,
    performRezero,
    performPhotometryMeasure,
    performDarkCurrent,
    performWavelengthCalibration,
  } = useDevice();

  const initialPrefs = useMemo(() => loadWorkspacePrefs(), []);
  const [mode, setMode] = useState(() => initialPrefs?.mode === "canvas" ? "canvas" : "simulation");
  const [panelLabels, setPanelLabels] = useState(() => ({ ...PANEL_LABEL_DEFAULTS, ...(initialPrefs?.panelLabels ?? {}) }));
  const [panelElementLayout, setPanelElementLayout] = useState(() => normalizePanelElementLayout(initialPrefs?.panelElementLayout ?? DEFAULT_PANEL_ELEMENT_LAYOUT));
  const [selectedPanelElementIds, setSelectedPanelElementIds] = useState(["titlePlate"]);
  const [selectedFieldId, setSelectedFieldId] = useState("titleLeft");
  const [lcdEditorEnabled, setLcdEditorEnabled] = useState(() => Boolean(initialPrefs?.lcdEditorEnabled));
  const [lcdEditorMode, setLcdEditorMode] = useState(() => initialPrefs?.lcdEditorMode === "edit" ? "edit" : "preview");
  const liveLcdRows = useMemo(() => normalizeLcdRows(getLcdRows(device)), [device]);
  const [lcdEditorRows, setLcdEditorRows] = useState(() => normalizeLcdRows(initialPrefs?.lcdEditorRows ?? []));
  const [lcdEditorSource, setLcdEditorSource] = useState("Из прибора");
  const [displayPresets, setDisplayPresets] = useState(() => Array.isArray(initialPrefs?.displayPresets) ? initialPrefs.displayPresets : []);
  const [panelLayout, setPanelLayout] = useState(() => ({ ...DEFAULT_PANEL_LAYOUT, ...(initialPrefs?.panelLayout ?? {}) }));
  const [windows, setWindows] = useState(() => normalizeWindowLayout(initialPrefs?.windows, DEFAULT_WINDOWS));
  const [saveStatus, setSaveStatus] = useState("");
  const saveStatusTimerRef = useRef(null);

  const isCanvasMode = mode === "canvas";
  const resolvedLabels = useMemo(() => ({ ...PANEL_LABEL_DEFAULTS, ...panelLabels }), [panelLabels]);
  const lcdRowsOverride = lcdEditorEnabled ? lcdEditorRows : null;
  const previewRows = useMemo(() => lcdRowsOverride ?? liveLcdRows, [lcdRowsOverride, liveLcdRows]);
  const persistedDeviceState = useMemo(() => getPersistedDeviceState(device), [device]);

  useEffect(() => {
    if (!lcdEditorEnabled) {
      setLcdEditorRows(liveLcdRows);
      setLcdEditorSource("Из прибора");
    }
  }, [lcdEditorEnabled, liveLcdRows]);

  useEffect(() => () => {
    if (saveStatusTimerRef.current) window.clearTimeout(saveStatusTimerRef.current);
  }, []);

  const currentSnapshot = useMemo(() => serializeWorkspacePrefs({
    deviceState: persistedDeviceState,
    mode,
    currentScreen: device.screen,
    panelLabels,
    panelElementLayout,
    lcdEditorEnabled,
    lcdEditorMode,
    lcdEditorRows,
    displayPresets,
    panelLayout,
    windows,
  }), [persistedDeviceState, mode, device.screen, panelLabels, panelElementLayout, lcdEditorEnabled, lcdEditorMode, lcdEditorRows, displayPresets, panelLayout, windows]);

  const [savedSnapshot, setSavedSnapshot] = useState(() => currentSnapshot);
  const canSave = currentSnapshot !== savedSnapshot;

  const flashStatus = useCallback((message) => {
    setSaveStatus(message);
    if (saveStatusTimerRef.current) window.clearTimeout(saveStatusTimerRef.current);
    saveStatusTimerRef.current = window.setTimeout(() => setSaveStatus(""), 2800);
  }, []);

  const persistWorkspace = useCallback((payload, message) => {
    try {
      window.localStorage.setItem(WORKSPACE_PREFS_KEY, JSON.stringify(payload));
      setSavedSnapshot(serializeWorkspacePrefs(payload));
      flashStatus(message);
    } catch (error) {
      console.error("Failed to save workspace preferences:", error);
      flashStatus("Ошибка сохранения");
    }
  }, [flashStatus]);

  const saveAll = useCallback(() => {
    const payload = {
      deviceState: persistedDeviceState,
      mode,
      currentScreen: device.screen,
      panelLabels,
      panelElementLayout,
      lcdEditorEnabled,
      lcdEditorMode,
      lcdEditorRows,
      displayPresets,
      panelLayout,
      windows,
    };

    try {
      window.localStorage.setItem(WORKSPACE_PREFS_KEY, JSON.stringify(payload));
      setSavedSnapshot(serializeWorkspacePrefs(payload));
      flashStatus(`Сохранено ${new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`);
    } catch (error) {
      console.error("Failed to save workspace preferences:", error);
      flashStatus("Ошибка сохранения");
    }
  }, [persistedDeviceState, mode, device.screen, panelLabels, panelElementLayout, lcdEditorEnabled, lcdEditorMode, lcdEditorRows, displayPresets, panelLayout, windows, flashStatus]);

  const saveDisplayPreset = useCallback((name) => {
    const preset = {
      id: `preset-${Date.now()}`,
      name: String(name || "LCD Preset").slice(0, 40),
      savedAt: new Date().toLocaleString("ru-RU"),
      rows: previewRows,
    };
    setDisplayPresets((current) => [preset, ...current].slice(0, 24));
    flashStatus("Корректировка дисплея добавлена");
  }, [previewRows, flashStatus]);

  const commitLcdChanges = useCallback(() => {
    const payload = {
      deviceState: persistedDeviceState,
      mode,
      currentScreen: device.screen,
      panelLabels,
      panelElementLayout,
      lcdEditorEnabled: true,
      lcdEditorMode: "preview",
      lcdEditorRows,
      displayPresets,
      panelLayout,
      windows,
    };

    setLcdEditorEnabled(true);
    setLcdEditorMode("preview");
    setLcdEditorSource("Зафиксировано");
    persistWorkspace(payload, "Изменения дисплея зафиксированы");
  }, [
    persistedDeviceState,
    mode,
    device.screen,
    panelLabels,
    panelElementLayout,
    lcdEditorRows,
    displayPresets,
    panelLayout,
    windows,
    persistWorkspace,
  ]);

  const loadDisplayPreset = useCallback((id) => {
    const preset = displayPresets.find((item) => item.id === id);
    if (!preset) return;
    setLcdEditorEnabled(true);
    setLcdEditorRows(normalizeLcdRows(preset.rows));
    setLcdEditorSource(`Пресет: ${preset.name}`);
    flashStatus(`Загружена корректировка ${preset.name}`);
  }, [displayPresets, flashStatus]);

  const deleteDisplayPreset = useCallback((id) => {
    setDisplayPresets((current) => current.filter((item) => item.id !== id));
  }, []);

  const updatePanelLayout = useCallback((key, value) => {
    setPanelLayout((current) => ({ ...current, [key]: value }));
  }, []);

  const updateCalibrationConfig = useCallback((key, value) => {
    const safeValue = Math.max(1, Math.min(9, Number(value) || 1));
    setDevice((current) => ({
      ...current,
      calibration: {
        ...current.calibration,
        [key]: safeValue,
        plan: buildCalibrationPlan(
          key === "standards" ? safeValue : current.calibration.standards,
          key === "parallels" ? safeValue : current.calibration.parallels,
        ),
        stepIndex: 0,
        resultCursor: 0,
      },
    }));
  }, [setDevice]);

  const generateTestResults = useCallback(() => {
    const wavelengths = [230, 280, 340, 420, 546.2, 620, 720];
    const sample = device.currentSample === "reference" ? "sampleA" : device.currentSample;

    setDevice((current) => {
      const measurements = wavelengths.map((wavelength, index) => {
        const measurement = measureSample({
          sample,
          wavelength,
          gain: current.gain,
          e100: current.e100,
          darkValues: current.darkValues,
        });

        return {
          index: index + 1,
          wavelength,
          ...measurement,
        };
      });

      const last = measurements[measurements.length - 1];
      return {
        ...current,
        measurements,
        measurementCursor: measurements.length - 1,
        lastEnergy: last.energy,
        lastComputedA: last.a,
        lastComputedT: last.t,
      };
    });

    flashStatus("Тестовые результаты сгенерированы");
  }, [device.currentSample, flashStatus, setDevice]);

  const navigateToScreen = useCallback((screen) => {
    setDevice((current) => {
      if (!screen || current.screen === screen) return current;

      return transitionToScreen(current, screen, {
        inputTarget: screen === "input" ? current.inputTarget || "wavelength" : undefined,
        inputBuffer: screen === "input" ? current.inputBuffer || String(current.wavelength) : undefined,
        dialogTitle: screen === "input" ? current.dialogTitle || "ВВОД ДАННЫХ" : undefined,
        returnScreen: screen === "input" || screen === "saveDialog" ? current.screen : undefined,
      });
    });

    flashStatus(`Переход: ${screen}`);
  }, [flashStatus, setDevice]);

  const updateSelectedPanelGeometry = useCallback((patch) => {
    setPanelElementLayout((current) => updatePanelSelectionGeometry(current, selectedPanelElementIds, patch));
  }, [selectedPanelElementIds]);

  const alignSelectedPanelElements = useCallback((alignment) => {
    setPanelElementLayout((current) => alignPanelSelection(current, selectedPanelElementIds, alignment));
  }, [selectedPanelElementIds]);

  const deleteSelectedPanelElements = useCallback((ids = selectedPanelElementIds) => {
    const targets = Array.isArray(ids) ? ids : selectedPanelElementIds;
    if (!targets.length) return;
    setPanelElementLayout((current) => hidePanelElements(current, targets));
    setSelectedPanelElementIds([]);
  }, [selectedPanelElementIds]);

  const renderInstrumentPanel = useCallback(() => (
    <InstrumentPanel
      device={device}
      onAction={handleAction}
      labels={resolvedLabels}
      selectedFieldId={selectedFieldId}
      onSelectField={setSelectedFieldId}
      lcdRowsOverride={lcdRowsOverride}
      panelLayoutConfig={panelLayout}
      panelElementLayout={panelElementLayout}
      selectedElementIds={selectedPanelElementIds}
      onSelectedElementIdsChange={setSelectedPanelElementIds}
      onPanelElementLayoutChange={setPanelElementLayout}
      onDeleteSelectedElements={deleteSelectedPanelElements}
      mode={mode}
    />
  ), [deleteSelectedPanelElements, device, handleAction, lcdRowsOverride, mode, panelElementLayout, panelLayout, resolvedLabels, selectedFieldId, selectedPanelElementIds]);

  const windowContent = useCallback((item) => {
    switch (item.id) {
      case "instrumentPanel":
        return renderInstrumentPanel();
      case "displayTools":
        return (
          <DisplayToolsCard
            device={device}
            previewRows={previewRows}
            presets={displayPresets}
            onSavePreset={saveDisplayPreset}
            onLoadPreset={loadDisplayPreset}
            onDeletePreset={deleteDisplayPreset}
          />
        );
      case "lcdEditor":
        return (
          <LcdTextEditor
            device={device}
            enabled={lcdEditorEnabled}
            rows={lcdEditorRows}
            previewRows={previewRows}
            editorMode={lcdEditorMode}
            onEditorModeChange={setLcdEditorMode}
            sourceLabel={lcdEditorSource}
            onCommitChanges={commitLcdChanges}
            onToggle={(checked) => {
              setLcdEditorEnabled(checked);
              setLcdEditorSource(checked ? "Ручной ввод" : "Из прибора");
              if (checked) setLcdEditorRows(liveLcdRows);
            }}
            onChangeRow={(index, patch) => {
              setLcdEditorSource("Ручной ввод");
              setLcdEditorRows((current) => current.map((row, rowIndex) => (
                rowIndex === index ? { ...row, ...patch } : row
              )));
            }}
            onResetFromDevice={() => {
              setLcdEditorSource("Из прибора");
              setLcdEditorRows(liveLcdRows);
            }}
            onClear={() => {
              setLcdEditorSource("Ручной ввод");
              setLcdEditorRows(normalizeLcdRows([]));
            }}
          />
        );
      case "cli":
        return <CliEmulator logLines={device.logLines} onExecute={executeCli} />;
      case "usb":
        return <UsbExportPanel device={device} onSelect={(index) => setDevice((current) => ({ ...current, usbPreviewIndex: index }))} />;
      case "navigation":
        return <NavigationInfo device={device} onCalibrationChange={updateCalibrationConfig} />;
      case "labelEditor":
        return (
          <PanelLabelEditorCard
            labels={resolvedLabels}
            selectedFieldId={selectedFieldId}
            onSelectField={setSelectedFieldId}
            onChange={(id, value) => setPanelLabels((current) => ({ ...current, [id]: value }))}
            onReset={(value) => {
              setPanelLabels(value);
              setSelectedFieldId("titleLeft");
            }}
          />
        );
      case "cCode":
        return <CCodeGeneratorCard labels={resolvedLabels} />;
      case "deviceState":
        return <DeviceMetricsCard device={device} onReset={resetAll} />;
      case "virtualSample":
        return (
          <VirtualSampleCard
            device={device}
            onSampleChange={(value) => setDevice((current) => ({ ...current, currentSample: value }))}
            onToggleD2Lamp={(checked) => setDevice((current) => ({ ...current, d2Lamp: checked }))}
            onToggleWLamp={(checked) => setDevice((current) => ({ ...current, wLamp: checked }))}
            onRezero={performRezero}
            onMeasure={performPhotometryMeasure}
            onDarkCurrent={performDarkCurrent}
            onCalibrateWl={performWavelengthCalibration}
          />
        );
      case "results":
        return (
          <MeasurementTable
            measurements={device.measurements}
            cursor={device.measurementCursor}
            screen={device.screen}
            onGenerateTest={generateTestResults}
          />
        );
      case "scenarioFlow":
        return <ScenarioFlowMap currentScreen={device.screen} onSelectScreen={navigateToScreen} />;
      case "panelLayout":
        return (
          <PanelLayoutEditorCard
            mode={mode}
            layout={panelLayout}
            onChange={updatePanelLayout}
            onReset={() => setPanelLayout(DEFAULT_PANEL_LAYOUT)}
            onResetElementLayout={() => setPanelElementLayout(DEFAULT_PANEL_ELEMENT_LAYOUT)}
            elementLayout={panelElementLayout}
            selectedElementIds={selectedPanelElementIds}
            onUpdateSelectionGeometry={updateSelectedPanelGeometry}
            onAlignSelection={alignSelectedPanelElements}
            onDeleteSelection={() => deleteSelectedPanelElements()}
          />
        );
      default:
        return null;
    }
  }, [
    commitLcdChanges,
    deleteDisplayPreset,
    device,
    displayPresets,
    executeCli,
    generateTestResults,
    lcdEditorEnabled,
    lcdEditorMode,
    lcdEditorRows,
    lcdEditorSource,
    liveLcdRows,
    loadDisplayPreset,
    mode,
    navigateToScreen,
    panelElementLayout,
    panelLayout,
    performDarkCurrent,
    performPhotometryMeasure,
    performRezero,
    performWavelengthCalibration,
    previewRows,
    renderInstrumentPanel,
    resolvedLabels,
    resetAll,
    saveDisplayPreset,
    selectedPanelElementIds,
    selectedFieldId,
    setDevice,
    updateSelectedPanelGeometry,
    alignSelectedPanelElements,
    deleteSelectedPanelElements,
    updateCalibrationConfig,
    updatePanelLayout,
  ]);

  return (
    <div className="min-h-screen bg-zinc-100 p-4 text-zinc-900">
      <div className="mx-auto max-w-[3200px] space-y-4">
        <AppHeader
          softwareVersion={device.softwareVersion}
          hardwareVersion={device.hardwareVersion}
          mode={mode}
          onModeChange={setMode}
          paused={isPaused}
          onTogglePause={togglePauseSimulation}
          onSaveAll={saveAll}
          canSave={canSave}
          saveStatus={saveStatus || (
            isCanvasMode
              ? "Холст: Shift+click и рамка дают мультивыбор, направляющие помогают выравниванию, Delete скрывает объекты."
              : "Симуляция: использует актуальную геометрию из холста, а разделитель между областями можно перетаскивать."
          )}
        />

        <WindowWorkspace
          mode={mode}
          windows={windows}
          setWindows={setWindows}
          renderWindow={windowContent}
        />
      </div>
    </div>
  );
}

export function Ecros5400UvSimulator() {
  const initialPrefs = loadWorkspacePrefs();
  const initialDeviceState = restorePersistedDeviceState(initialPrefs?.deviceState, initialPrefs?.currentScreen);

  return (
    <DeviceProvider initialDeviceState={initialDeviceState}>
      <AppContent />
    </DeviceProvider>
  );
}
