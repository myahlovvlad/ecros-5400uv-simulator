import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDevice, DeviceProvider } from "../contexts/DeviceContext.jsx";
import { AppHeader } from "./AppHeader.jsx";
import { CliEmulator } from "./CliEmulator.jsx";
import { DeviceStatus } from "./DeviceStatus.jsx";
import { InstrumentPanel, PANEL_LABEL_DEFAULTS } from "./InstrumentPanel.jsx";
import { LcdTextEditor, normalizeLcdRows } from "./LcdTextEditor.jsx";
import { MeasurementTable } from "./MeasurementTable.jsx";
import { MenuTreeGraph } from "./MenuTreeGraph.jsx";
import { NavigationInfo } from "./NavigationInfo.jsx";
import { PanelLabelEditor } from "./PanelLabelEditor.jsx";
import { UsbExportPanel } from "./UsbExportPanel.jsx";
import {
  normalizeGlyphMatrix,
  serializeBitmapFontCDefinition,
  serializeScreenBufferCDefinition,
} from "../../infrastructure/adapters/LcdRenderer.js";
import { getLcdRows } from "../../infrastructure/adapters/LcdRenderer.js";

const WORKSPACE_STORAGE_KEY = "ecros_workspace_snapshot_v2";
const LEGACY_LCD_EDITOR_STORAGE_KEY = "ecros_lcd_editor_snapshot";
const DEFAULT_LCD_EDITOR_OPTIONS = { titleUnderline: false };
const WINDOW_TITLES = {
  menuGraph: "Граф меню",
  lcdEditor: "Редактор LCD",
  labelEditor: "Редактор надписей",
  deviceStatus: "Состояние прибора",
  measurementTable: "Последние результаты",
  cli: "CLI",
  usb: "USB",
  navigation: "Навигация",
};
const DEFAULT_WINDOW_LAYOUT = {
  menuGraph: { x: 20, y: 20, width: 920, z: 1, collapsed: false },
  lcdEditor: { x: 20, y: 360, width: 580, z: 2, collapsed: false },
  labelEditor: { x: 620, y: 360, width: 520, z: 3, collapsed: false },
  deviceStatus: { x: 1160, y: 360, width: 420, z: 4, collapsed: false },
  measurementTable: { x: 20, y: 980, width: 520, z: 5, collapsed: false },
  cli: { x: 560, y: 980, width: 520, z: 6, collapsed: false },
  usb: { x: 1100, y: 980, width: 420, z: 7, collapsed: false },
  navigation: { x: 1100, y: 620, width: 420, z: 8, collapsed: false },
};
const WINDOW_HEIGHT_HINTS = {
  menuGraph: 320,
  lcdEditor: 620,
  labelEditor: 520,
  deviceStatus: 420,
  measurementTable: 340,
  cli: 300,
  usb: 340,
  navigation: 280,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function normalizeGlyphOverrides(glyphOverrides = {}) {
  return Object.fromEntries(
    Object.entries(glyphOverrides ?? {}).map(([char, matrix]) => [char, normalizeGlyphMatrix(matrix)]),
  );
}

function normalizeLcdEditorState(snapshot, liveRows) {
  return {
    touched: Boolean(snapshot?.touched),
    rows: normalizeLcdRows(snapshot?.rows ?? liveRows),
    options: {
      titleUnderline: Boolean(snapshot?.options?.titleUnderline),
    },
    glyphOverrides: normalizeGlyphOverrides(snapshot?.glyphOverrides),
  };
}

function buildLcdScreenFingerprint(screen, liveRows) {
  return JSON.stringify({
    screen: String(screen ?? ""),
    rows: normalizeLcdRows(liveRows),
  });
}

function normalizeSavedLcdOverrides(savedOverrides = {}) {
  return Object.fromEntries(
    Object.entries(savedOverrides ?? {}).map(([fingerprint, override]) => {
      const screenFingerprint = String(override?.screenFingerprint ?? fingerprint);
      return [
        screenFingerprint,
        {
          screenFingerprint,
          rows: normalizeLcdRows(override?.rows),
          options: {
            titleUnderline: Boolean(override?.options?.titleUnderline),
          },
          glyphOverrides: normalizeGlyphOverrides(override?.glyphOverrides),
        },
      ];
    }),
  );
}

function resolveEffectiveLcdDisplay({
  lcdEditorEnabled,
  liveRows,
  appliedRows,
  appliedOptions,
  appliedGlyphOverrides,
  savedLcdOverrides,
  screenFingerprint,
}) {
  if (lcdEditorEnabled) {
    return {
      rows: normalizeLcdRows(appliedRows),
      options: {
        titleUnderline: Boolean(appliedOptions?.titleUnderline),
      },
      glyphOverrides: normalizeGlyphOverrides(appliedGlyphOverrides),
      source: "manual",
    };
  }

  const savedOverride = savedLcdOverrides?.[screenFingerprint];
  if (savedOverride) {
    return {
      rows: normalizeLcdRows(savedOverride.rows),
      options: {
        titleUnderline: Boolean(savedOverride.options?.titleUnderline),
      },
      glyphOverrides: normalizeGlyphOverrides(savedOverride.glyphOverrides),
      source: "saved-override",
    };
  }

  return {
    rows: normalizeLcdRows(liveRows),
    options: {
      titleUnderline: false,
    },
    glyphOverrides: {},
    source: "live",
  };
}

function normalizeWindowLayout(layout = {}) {
  return Object.fromEntries(
    Object.entries(DEFAULT_WINDOW_LAYOUT).map(([windowId, defaults]) => {
      const next = layout?.[windowId] ?? {};
      return [
        windowId,
        {
          ...defaults,
          x: Number.isFinite(next.x) ? next.x : defaults.x,
          y: Number.isFinite(next.y) ? next.y : defaults.y,
          width: Number.isFinite(next.width) ? next.width : defaults.width,
          z: Number.isFinite(next.z) ? next.z : defaults.z,
          collapsed: Boolean(next.collapsed),
        },
      ];
    }),
  );
}

function normalizeWorkspaceSnapshot(snapshot, liveRows) {
  return {
    panelLabels: { ...PANEL_LABEL_DEFAULTS, ...(snapshot?.panelLabels ?? {}) },
    lcd: {
      ...normalizeLcdEditorState(snapshot?.lcd, liveRows),
      savedOverrides: normalizeSavedLcdOverrides(snapshot?.lcd?.savedOverrides),
    },
    windows: normalizeWindowLayout(snapshot?.windows),
  };
}

function buildWorkspaceSnapshot({ panelLabels, lcd, windows }) {
  return {
    panelLabels: { ...PANEL_LABEL_DEFAULTS, ...panelLabels },
    lcd: {
      touched: Boolean(lcd.touched),
      rows: normalizeLcdRows(lcd.rows),
      options: {
        titleUnderline: Boolean(lcd.options?.titleUnderline),
      },
      glyphOverrides: normalizeGlyphOverrides(lcd.glyphOverrides),
      savedOverrides: normalizeSavedLcdOverrides(lcd.savedOverrides),
    },
    windows: normalizeWindowLayout(windows),
  };
}

function areSnapshotsEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function WorkspaceWindow({
  windowId,
  state,
  title,
  onToggleCollapse,
  onFocus,
  onStartDrag,
  children,
}) {
  return (
    <section
      data-testid={`tile-${windowId}`}
      className="absolute overflow-hidden rounded-3xl border border-zinc-300/70 bg-white/95 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur"
      style={{
        left: state.x,
        top: state.y,
        width: state.width,
        zIndex: state.z,
      }}
      onPointerDown={() => onFocus(windowId)}
    >
      <div
        data-testid={`window-handle-${windowId}`}
        onPointerDown={(event) => onStartDrag(windowId, event)}
        className="flex cursor-grab items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-100/90 px-4 py-3"
      >
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Workspace</div>
          <div className="text-sm font-semibold text-zinc-800">{title}</div>
        </div>
        <button
          type="button"
          data-testid={`tile-${windowId}-toggle`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onToggleCollapse(windowId)}
          className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm hover:bg-white"
        >
          {state.collapsed ? "Развернуть" : "Свернуть"}
        </button>
      </div>
      {state.collapsed ? null : <div className="p-3">{children}</div>}
    </section>
  );
}

function AppContent() {
  const {
    device,
    setDevice,
    handleAction,
    executeCli,
    resetAll,
    performRezero,
    performPhotometryMeasure,
    performDarkCurrent,
    performWavelengthCalibration,
    togglePause,
  } = useDevice();

  const lcdCanvasRef = useRef(null);
  const workspaceRef = useRef(null);
  const dragStateRef = useRef(null);
  const windowsRef = useRef(DEFAULT_WINDOW_LAYOUT);
  const nextZRef = useRef(9);

  const liveLcdRows = useMemo(() => normalizeLcdRows(getLcdRows(device)), [device]);
  const currentLcdScreenFingerprint = useMemo(
    () => buildLcdScreenFingerprint(device.screen, liveLcdRows),
    [device.screen, liveLcdRows],
  );
  const initialLiveLcdRowsRef = useRef(liveLcdRows);
  const [panelLabels, setPanelLabels] = useState(PANEL_LABEL_DEFAULTS);
  const [selectedFieldId, setSelectedFieldId] = useState("titleCenter");
  const [selectedLcdRowIndex, setSelectedLcdRowIndex] = useState(0);
  const [lcdEditorEnabled, setLcdEditorEnabled] = useState(false);
  const [lcdEditorTouched, setLcdEditorTouched] = useState(false);
  const [appliedLcdRows, setAppliedLcdRows] = useState(liveLcdRows);
  const [appliedLcdOptions, setAppliedLcdOptions] = useState(DEFAULT_LCD_EDITOR_OPTIONS);
  const [appliedGlyphOverrides, setAppliedGlyphOverrides] = useState({});
  const [savedLcdOverrides, setSavedLcdOverrides] = useState({});
  const [workspaceWindows, setWorkspaceWindows] = useState(DEFAULT_WINDOW_LAYOUT);
  const [savedWorkspaceSnapshot, setSavedWorkspaceSnapshot] = useState(null);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    windowsRef.current = workspaceWindows;
    nextZRef.current = Math.max(...Object.values(workspaceWindows).map((windowState) => windowState.z), 0) + 1;
  }, [workspaceWindows]);

  useEffect(() => {
    if (!lcdEditorTouched) {
      setAppliedLcdRows(liveLcdRows);
    }
  }, [lcdEditorTouched, liveLcdRows]);

  useEffect(() => {
    if (typeof window === "undefined") {
      setStorageReady(true);
      return;
    }

    try {
      const rawSnapshot = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (rawSnapshot) {
        const normalizedSnapshot = normalizeWorkspaceSnapshot(JSON.parse(rawSnapshot), initialLiveLcdRowsRef.current);
        setPanelLabels(normalizedSnapshot.panelLabels);
        setAppliedLcdRows(normalizedSnapshot.lcd.rows);
        setAppliedLcdOptions(normalizedSnapshot.lcd.options);
        setAppliedGlyphOverrides(normalizedSnapshot.lcd.glyphOverrides);
        setSavedLcdOverrides(normalizedSnapshot.lcd.savedOverrides);
        setLcdEditorTouched(normalizedSnapshot.lcd.touched || Object.keys(normalizedSnapshot.lcd.glyphOverrides).length > 0);
        setWorkspaceWindows(normalizedSnapshot.windows);
        setSavedWorkspaceSnapshot(normalizedSnapshot);
      } else {
        const legacyRaw = window.localStorage.getItem(LEGACY_LCD_EDITOR_STORAGE_KEY);
        if (legacyRaw) {
          const legacySnapshot = normalizeLcdEditorState(JSON.parse(legacyRaw), initialLiveLcdRowsRef.current);
          setAppliedLcdRows(legacySnapshot.rows);
          setAppliedLcdOptions(legacySnapshot.options);
          setLcdEditorTouched(true);
        }
      }
    } catch (error) {
      console.error("Failed to restore workspace snapshot", error);
    } finally {
      setStorageReady(true);
    }
  }, []);

  const currentSnapshot = useMemo(
    () => buildWorkspaceSnapshot({
      panelLabels,
      lcd: {
        touched: lcdEditorTouched,
        rows: appliedLcdRows,
        options: appliedLcdOptions,
        glyphOverrides: appliedGlyphOverrides,
        savedOverrides: savedLcdOverrides,
      },
      windows: workspaceWindows,
    }),
    [appliedGlyphOverrides, appliedLcdOptions, appliedLcdRows, lcdEditorTouched, panelLabels, savedLcdOverrides, workspaceWindows],
  );

  const defaultSnapshot = useMemo(
    () => buildWorkspaceSnapshot({
      panelLabels: PANEL_LABEL_DEFAULTS,
      lcd: {
        touched: false,
        rows: liveLcdRows,
        options: DEFAULT_LCD_EDITOR_OPTIONS,
        glyphOverrides: {},
        savedOverrides: {},
      },
      windows: DEFAULT_WINDOW_LAYOUT,
    }),
    [liveLcdRows],
  );

  const hasGlobalUnsavedChanges = useMemo(
    () => storageReady && !areSnapshotsEqual(currentSnapshot, savedWorkspaceSnapshot ?? defaultSnapshot),
    [currentSnapshot, defaultSnapshot, savedWorkspaceSnapshot, storageReady],
  );

  const resolvedLabels = useMemo(() => ({ ...PANEL_LABEL_DEFAULTS, ...panelLabels }), [panelLabels]);
  const effectiveLcdDisplay = useMemo(
    () => resolveEffectiveLcdDisplay({
      lcdEditorEnabled,
      liveRows: liveLcdRows,
      appliedRows: appliedLcdRows,
      appliedOptions: appliedLcdOptions,
      appliedGlyphOverrides,
      savedLcdOverrides,
      screenFingerprint: currentLcdScreenFingerprint,
    }),
    [
      appliedGlyphOverrides,
      appliedLcdOptions,
      appliedLcdRows,
      currentLcdScreenFingerprint,
      lcdEditorEnabled,
      liveLcdRows,
      savedLcdOverrides,
    ],
  );
  const displayUsesOverride = effectiveLcdDisplay.source !== "live";
  const lcdRowsOverride = displayUsesOverride ? effectiveLcdDisplay.rows : null;
  const lcdGlyphOverrides = displayUsesOverride ? effectiveLcdDisplay.glyphOverrides : null;

  const bringWindowToFront = (windowId) => {
    setWorkspaceWindows((current) => ({
      ...current,
      [windowId]: {
        ...current[windowId],
        z: nextZRef.current++,
      },
    }));
  };

  const handleStartDragWindow = (windowId, event) => {
    if (event.button !== 0) return;
    const workspaceRect = workspaceRef.current?.getBoundingClientRect();
    const windowState = windowsRef.current[windowId];
    if (!workspaceRect || !windowState) return;

    bringWindowToFront(windowId);
    dragStateRef.current = {
      windowId,
      offsetX: event.clientX - workspaceRect.left - windowState.x,
      offsetY: event.clientY - workspaceRect.top - windowState.y,
    };
    event.preventDefault();
  };

  useEffect(() => {
    const handlePointerMove = (event) => {
      const dragState = dragStateRef.current;
      const workspaceRect = workspaceRef.current?.getBoundingClientRect();
      if (!dragState || !workspaceRect) return;

      const windowState = windowsRef.current[dragState.windowId];
      if (!windowState) return;

      const nextX = clamp(event.clientX - workspaceRect.left - dragState.offsetX, 0, Math.max(0, workspaceRect.width - windowState.width));
      const nextY = clamp(event.clientY - workspaceRect.top - dragState.offsetY, 0, 2800);

      setWorkspaceWindows((current) => ({
        ...current,
        [dragState.windowId]: {
          ...current[dragState.windowId],
          x: nextX,
          y: nextY,
        },
      }));
    };

    const handlePointerUp = () => {
      dragStateRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  const workspaceHeight = useMemo(
    () => Math.max(
      1400,
      ...Object.entries(workspaceWindows).map(([windowId, windowState]) => windowState.y + (windowState.collapsed ? 76 : WINDOW_HEIGHT_HINTS[windowId] ?? 320)),
    ),
    [workspaceWindows],
  );

  const saveAllChanges = () => {
    const nextSavedLcdOverrides = lcdEditorEnabled
      ? normalizeSavedLcdOverrides({
          ...savedLcdOverrides,
          [currentLcdScreenFingerprint]: {
            screenFingerprint: currentLcdScreenFingerprint,
            rows: appliedLcdRows,
            options: appliedLcdOptions,
            glyphOverrides: appliedGlyphOverrides,
          },
        })
      : savedLcdOverrides;
    const nextSnapshot = buildWorkspaceSnapshot({
      panelLabels,
      lcd: {
        touched: lcdEditorTouched,
        rows: appliedLcdRows,
        options: appliedLcdOptions,
        glyphOverrides: appliedGlyphOverrides,
        savedOverrides: nextSavedLcdOverrides,
      },
      windows: workspaceWindows,
    });

    if (typeof window !== "undefined") {
      window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(nextSnapshot));
    }
    setSavedLcdOverrides(nextSavedLcdOverrides);
    setSavedWorkspaceSnapshot(nextSnapshot);
    if (lcdEditorEnabled) {
      setLcdEditorEnabled(false);
    }
  };

  const resetAllWorkspaceChanges = () => {
    setPanelLabels(PANEL_LABEL_DEFAULTS);
    setAppliedLcdRows(liveLcdRows);
    setAppliedLcdOptions(DEFAULT_LCD_EDITOR_OPTIONS);
    setAppliedGlyphOverrides({});
    setSavedLcdOverrides({});
    setLcdEditorTouched(false);
    setWorkspaceWindows(DEFAULT_WINDOW_LAYOUT);
    setLcdEditorEnabled(false);
    setSelectedFieldId("titleCenter");
    setSelectedLcdRowIndex(0);
    setSavedWorkspaceSnapshot(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_LCD_EDITOR_STORAGE_KEY);
    }
  };

  const exportCurrentLcdPng = async () => {
    const canvas = lcdCanvasRef.current;
    if (!canvas) return;
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return;
    downloadBlob(blob, `ecros-5400uv-lcd-${Date.now()}.png`);
  };

  const exportCurrentLcdScreenC = () => {
    const content = serializeScreenBufferCDefinition(effectiveLcdDisplay.rows, {
      titleUnderline: effectiveLcdDisplay.options.titleUnderline,
      glyphOverrides: effectiveLcdDisplay.glyphOverrides,
      variableName: "kEcros5400UvLcdScreen",
    });
    downloadBlob(new Blob([content], { type: "text/plain;charset=utf-8" }), "ecros-5400uv-lcd-screen.h");
  };

  const exportCurrentFontC = () => {
    const content = serializeBitmapFontCDefinition(effectiveLcdDisplay.glyphOverrides);
    downloadBlob(new Blob([content], { type: "text/plain;charset=utf-8" }), "ecros-5400uv-bitmap-font.h");
  };

  const windows = {
    menuGraph: <MenuTreeGraph currentScreen={device.screen} />,
    lcdEditor: (
      <LcdTextEditor
        enabled={lcdEditorEnabled}
        rows={effectiveLcdDisplay.rows}
        options={effectiveLcdDisplay.options}
        glyphOverrides={effectiveLcdDisplay.glyphOverrides}
        selectedRowIndex={selectedLcdRowIndex}
        hasGlobalUnsavedChanges={hasGlobalUnsavedChanges}
        onToggle={(checked) => setLcdEditorEnabled(checked)}
        onSelectRow={setSelectedLcdRowIndex}
        onApplyRow={(index, row) => {
          setAppliedLcdRows((current) => current.map((currentRow, rowIndex) => (rowIndex === index ? row : currentRow)));
          setLcdEditorTouched(true);
        }}
        onResetRow={(index) => {
          setAppliedLcdRows((current) => current.map((currentRow, rowIndex) => (rowIndex === index ? liveLcdRows[index] : currentRow)));
          setLcdEditorTouched(true);
        }}
        onApplyOptions={(nextOptions) => {
          setAppliedLcdOptions(nextOptions);
          if (nextOptions.titleUnderline) {
            setAppliedLcdRows((current) => current.map((row, index) => (index === 0 ? { ...row, inverted: false } : row)));
          }
          setLcdEditorTouched(true);
        }}
        onLoadDevice={() => {
          setAppliedLcdRows(liveLcdRows);
          setAppliedLcdOptions(DEFAULT_LCD_EDITOR_OPTIONS);
          setAppliedGlyphOverrides({});
          setLcdEditorTouched(true);
        }}
        onClearApplied={() => {
          setAppliedLcdRows(normalizeLcdRows([]));
          setAppliedLcdOptions(DEFAULT_LCD_EDITOR_OPTIONS);
          setAppliedGlyphOverrides({});
          setLcdEditorTouched(true);
        }}
        onExportPng={exportCurrentLcdPng}
        onExportScreenC={exportCurrentLcdScreenC}
        onExportFontC={exportCurrentFontC}
        onApplyGlyph={(char, matrix) => {
          setAppliedGlyphOverrides((current) => ({
            ...current,
            [char]: normalizeGlyphMatrix(matrix),
          }));
          setLcdEditorTouched(true);
        }}
        onResetGlyph={(char) => {
          setAppliedGlyphOverrides((current) => {
            const next = { ...current };
            delete next[char];
            return next;
          });
          setLcdEditorTouched(true);
        }}
      />
    ),
    labelEditor: (
      <PanelLabelEditor
        labels={resolvedLabels}
        selectedFieldId={selectedFieldId}
        onSelectField={setSelectedFieldId}
        onApplyField={(fieldId, value) => {
          setPanelLabels((current) => ({
            ...current,
            [fieldId]: value,
          }));
        }}
        onResetAll={(value) => {
          setPanelLabels(value);
          setSelectedFieldId("titleCenter");
        }}
      />
    ),
    deviceStatus: (
      <DeviceStatus
        device={device}
        onReset={resetAll}
        onTogglePause={togglePause}
        onSampleChange={(value) => setDevice((current) => ({ ...current, currentSample: value }))}
        onToggleD2Lamp={(checked) => setDevice((current) => ({ ...current, d2Lamp: checked }))}
        onToggleWLamp={(checked) => setDevice((current) => ({ ...current, wLamp: checked }))}
        onRezero={performRezero}
        onMeasure={performPhotometryMeasure}
        onDarkCurrent={performDarkCurrent}
        onCalibrateWl={performWavelengthCalibration}
        onExportLcdImage={exportCurrentLcdPng}
      />
    ),
    measurementTable: <MeasurementTable measurements={device.measurements} cursor={device.measurementCursor} screen={device.screen} />,
    cli: <CliEmulator logLines={device.logLines} onExecute={executeCli} />,
    usb: <UsbExportPanel device={device} onSelect={(index) => setDevice((current) => ({ ...current, usbPreviewIndex: index }))} />,
    navigation: <NavigationInfo device={device} />,
  };

  return (
    <div data-testid="app-root" className="min-h-screen bg-zinc-100 text-zinc-900">
      <div className="mx-auto max-w-[1800px] space-y-4 px-4 py-4">
        <AppHeader softwareVersion={device.softwareVersion} hardwareVersion={device.hardwareVersion} />

        <div className="rounded-[36px] border border-zinc-200 bg-white/80 p-4 shadow-sm">
          <InstrumentPanel
            device={device}
            onAction={handleAction}
            labels={resolvedLabels}
            selectedFieldId={selectedFieldId}
            onSelectField={setSelectedFieldId}
            lcdRowsOverride={lcdRowsOverride}
            lcdEditorEnabled={lcdEditorEnabled}
            selectedLcdRowIndex={selectedLcdRowIndex}
            onSelectLcdRow={setSelectedLcdRowIndex}
            onMoveLcdRow={(index, patch) => {
              setAppliedLcdRows((current) => current.map((row, rowIndex) => (
                rowIndex === index ? { ...row, ...patch } : row
              )));
              setLcdEditorTouched(true);
            }}
            onCanvasReady={(canvas) => {
              lcdCanvasRef.current = canvas;
            }}
            titleUnderline={displayUsesOverride ? effectiveLcdDisplay.options.titleUnderline : false}
            glyphOverrides={lcdGlyphOverrides}
          />
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Workspace</h2>
              <p className="text-sm text-zinc-500">Окна можно перемещать мышью как на рабочем столе. Глобальная фиксация сохраняет только уже применённые изменения.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={saveAllChanges}
                disabled={!hasGlobalUnsavedChanges}
                data-testid="workspace-save-all"
                className={`rounded-xl px-3 py-1.5 text-sm transition ${
                  hasGlobalUnsavedChanges
                    ? "border border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700"
                    : "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400"
                }`}
              >
                Сохранить всё
              </button>
              <button
                type="button"
                onClick={resetAllWorkspaceChanges}
                data-testid="workspace-reset-all"
                className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
              >
                Сбросить всё
              </button>
              <div className={`rounded-full px-3 py-1 text-xs font-medium ${hasGlobalUnsavedChanges ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"}`}>
                {hasGlobalUnsavedChanges ? "Есть несохранённые applied-изменения" : "Все applied-изменения зафиксированы"}
              </div>
            </div>
          </div>
        </div>

        <div
          ref={workspaceRef}
          data-testid="workspace-desktop"
          className="relative overflow-auto rounded-[36px] border border-zinc-200 bg-[radial-gradient(circle_at_top_left,#ffffff_0%,#eef4f1_48%,#e2ebe7_100%)] p-4 shadow-inner"
          style={{ minHeight: `${workspaceHeight}px` }}
        >
          {Object.entries(windows).map(([windowId, content]) => (
            <WorkspaceWindow
              key={windowId}
              windowId={windowId}
              title={WINDOW_TITLES[windowId]}
              state={workspaceWindows[windowId]}
              onToggleCollapse={(id) => setWorkspaceWindows((current) => ({
                ...current,
                [id]: {
                  ...current[id],
                  collapsed: !current[id].collapsed,
                },
              }))}
              onFocus={bringWindowToFront}
              onStartDrag={handleStartDragWindow}
            >
              {content}
            </WorkspaceWindow>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Ecros5400UvSimulator() {
  return (
    <DeviceProvider>
      <AppContent />
    </DeviceProvider>
  );
}
