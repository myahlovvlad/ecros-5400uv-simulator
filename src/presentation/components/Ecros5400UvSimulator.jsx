import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDevice, DeviceProvider } from "../contexts/DeviceContext.jsx";
import { AppHeader } from "./AppHeader.jsx";
import { CliEmulator } from "./CliEmulator.jsx";
import { DeviceStatus } from "./DeviceStatus.jsx";
import { InstrumentPanel, PANEL_LABEL_DEFAULTS } from "./InstrumentPanel.jsx";
import { LcdTextEditor, normalizeLcdRows } from "./LcdTextEditor.jsx";
import { MeasurementTable } from "./MeasurementTable.jsx";
import { NavigationInfo } from "./NavigationInfo.jsx";
import { PanelLabelEditor } from "./PanelLabelEditor.jsx";
import { UsbExportPanel } from "./UsbExportPanel.jsx";
import { StateBus } from "../../application/services/StateBus.js";
import { getLcdRows, LCDRenderer, serializeBitmapFontDefinition } from "../../infrastructure/adapters/LcdRenderer.js";

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

const DEFAULT_TILE_ORDER = ["lcdEditor", "labelEditor", "deviceStatus", "measurementTable", "cli", "usb", "navigation"];
const TILE_TITLES = {
  lcdEditor: "Редактор LCD",
  labelEditor: "Редактор надписей",
  deviceStatus: "Состояние прибора",
  measurementTable: "Последние результаты",
  cli: "CLI",
  usb: "USB",
  navigation: "Навигация",
};

function moveTile(order, tileId, direction) {
  const currentIndex = order.indexOf(tileId);
  if (currentIndex === -1) return order;
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= order.length) return order;
  const nextOrder = [...order];
  [nextOrder[currentIndex], nextOrder[targetIndex]] = [nextOrder[targetIndex], nextOrder[currentIndex]];
  return nextOrder;
}

function reorderTiles(order, fromId, toId) {
  const fromIndex = order.indexOf(fromId);
  const toIndex = order.indexOf(toId);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return order;

  const nextOrder = [...order];
  const [moved] = nextOrder.splice(fromIndex, 1);
  nextOrder.splice(toIndex, 0, moved);
  return nextOrder;
}

function TileShell({
  tileId,
  collapsed,
  onToggleCollapse,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDrop,
  children,
}) {
  return (
    <div
      data-testid={`tile-${tileId}`}
      draggable
      onDragStart={() => onDragStart(tileId)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => onDrop(tileId)}
      className="rounded-3xl border border-zinc-200/70 bg-white/40 p-2"
    >
      <div className="mb-2 flex items-center justify-between gap-3 rounded-2xl bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-600">
        <span className="truncate">{TILE_TITLES[tileId]}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            data-testid={`tile-${tileId}-move-up`}
            onClick={() => onMoveUp(tileId)}
            className="rounded-lg px-2 py-1 hover:bg-white"
          >
            ↑
          </button>
          <button
            type="button"
            data-testid={`tile-${tileId}-move-down`}
            onClick={() => onMoveDown(tileId)}
            className="rounded-lg px-2 py-1 hover:bg-white"
          >
            ↓
          </button>
          <button
            type="button"
            data-testid={`tile-${tileId}-toggle`}
            onClick={() => onToggleCollapse(tileId)}
            className="rounded-lg px-2 py-1 hover:bg-white"
          >
            {collapsed ? "Развернуть" : "Свернуть"}
          </button>
        </div>
      </div>
      {collapsed ? null : children}
    </div>
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
  const deviceRef = useRef(device);
  const [panelLabels, setPanelLabels] = useState(PANEL_LABEL_DEFAULTS);
  const [selectedFieldId, setSelectedFieldId] = useState("titleCenter");
  const [selectedLcdRowIndex, setSelectedLcdRowIndex] = useState(0);
  const [lcdEditorEnabled, setLcdEditorEnabled] = useState(false);
  const [lcdEditorOptions, setLcdEditorOptions] = useState({ titleUnderline: false });
  const [tileOrder, setTileOrder] = useState(DEFAULT_TILE_ORDER);
  const [collapsedTiles, setCollapsedTiles] = useState({});
  const [draggedTileId, setDraggedTileId] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(520);
  const liveLcdRows = useMemo(() => normalizeLcdRows(getLcdRows(device)), [device]);
  const [lcdEditorRows, setLcdEditorRows] = useState(liveLcdRows);
  const resolvedLabels = useMemo(() => ({ ...PANEL_LABEL_DEFAULTS, ...panelLabels }), [panelLabels]);
  const lcdRowsOverride = lcdEditorEnabled ? lcdEditorRows : null;
  const lcdWarnings = useMemo(() => lcdEditorRows.map((row) => LCDRenderer.getUnmappedGlyphs(row.text)), [lcdEditorRows]);

  useEffect(() => {
    deviceRef.current = device;
  }, [device]);

  useEffect(() => {
    if (!lcdEditorEnabled) setLcdEditorRows(liveLcdRows);
  }, [lcdEditorEnabled, liveLcdRows]);

  useEffect(() => {
    return StateBus.on("wavelength:changed", (wavelength) => {
      if (lcdEditorEnabled) return;
      const nextDevice = { ...deviceRef.current, wavelength };
      setLcdEditorRows(normalizeLcdRows(getLcdRows(nextDevice)));
    });
  }, [lcdEditorEnabled]);

  const exportLcdPng = async () => {
    const canvas = lcdCanvasRef.current;
    if (!canvas) return;

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return;
    downloadBlob(blob, `ecros-5400uv-lcd-${Date.now()}.png`);
  };

  const exportFont = () => {
    const blob = new Blob([serializeBitmapFontDefinition()], { type: "application/json;charset=utf-8" });
    downloadBlob(blob, "ecros-5400uv-bitmap-font.json");
  };

  const tiles = {
    lcdEditor: (
      <LcdTextEditor
        enabled={lcdEditorEnabled}
        rows={lcdEditorRows}
        warnings={lcdWarnings}
        options={lcdEditorOptions}
        selectedRowIndex={selectedLcdRowIndex}
        onSelectRow={setSelectedLcdRowIndex}
        onToggle={(checked) => {
          setLcdEditorEnabled(checked);
          if (checked) setLcdEditorRows(liveLcdRows);
        }}
        onChangeOptions={(patch) => {
          if (patch.titleUnderline) {
            setLcdEditorRows((current) => current.map((row, index) => (index === 0 ? { ...row, inverted: false } : row)));
          }
          setLcdEditorOptions((current) => ({ ...current, ...patch }));
        }}
        onChangeRow={(index, patch) => {
          setLcdEditorRows((current) => current.map((row, rowIndex) => (
            rowIndex === index ? { ...row, ...patch } : row
          )));
        }}
        onResetFromDevice={() => {
          setLcdEditorRows(liveLcdRows);
          setLcdEditorOptions((current) => ({ ...current, titleUnderline: false }));
        }}
        onClear={() => setLcdEditorRows(normalizeLcdRows([]))}
        onExportPng={exportLcdPng}
        onExportFont={exportFont}
      />
    ),
    labelEditor: (
      <PanelLabelEditor
        labels={resolvedLabels}
        selectedFieldId={selectedFieldId}
        onSelectField={setSelectedFieldId}
        onChange={(id, value) => {
          setPanelLabels((current) => {
            const nextLabels = { ...current, [id]: value };
            StateBus.emit("labels:changed", { ...PANEL_LABEL_DEFAULTS, ...nextLabels });
            return nextLabels;
          });
        }}
        onReset={(value) => {
          StateBus.emit("labels:changed", value);
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

        <div
          className="grid gap-4 xl:[grid-template-columns:minmax(0,1fr)_var(--sidebar-width)]"
          style={{ "--sidebar-width": `${sidebarWidth}px` }}
        >
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
              setLcdEditorRows((current) => current.map((row, rowIndex) => (
                rowIndex === index ? { ...row, ...patch } : row
              )));
            }}
            onCanvasReady={(canvas) => {
              lcdCanvasRef.current = canvas;
            }}
            titleUnderline={lcdEditorOptions.titleUnderline}
          />

          <div className="space-y-4">
            <div data-testid="sidebar-width-control" className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Ширина панелей</div>
                  <div className="text-xs text-zinc-500">Регулирует ширину блока с редакторами, CLI, USB и навигацией</div>
                </div>
                <div className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700">{sidebarWidth}px</div>
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                {[420, 520, 640, 760].map((width) => (
                  <button
                    key={width}
                    type="button"
                    data-testid={`sidebar-width-${width}`}
                    onClick={() => setSidebarWidth(width)}
                    className={`rounded-xl border px-3 py-1.5 text-sm ${
                      sidebarWidth === width ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    {width}px
                  </button>
                ))}
              </div>
              <input
                aria-label="Ширина правой панели"
                data-testid="sidebar-width-range"
                type="range"
                min={360}
                max={760}
                step={20}
                value={sidebarWidth}
                onChange={(event) => setSidebarWidth(Number(event.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>

            {tileOrder.map((tileId) => (
              <TileShell
                key={tileId}
                tileId={tileId}
                collapsed={Boolean(collapsedTiles[tileId])}
                onToggleCollapse={(id) => setCollapsedTiles((current) => ({ ...current, [id]: !current[id] }))}
                onMoveUp={(id) => setTileOrder((current) => moveTile(current, id, "up"))}
                onMoveDown={(id) => setTileOrder((current) => moveTile(current, id, "down"))}
                onDragStart={setDraggedTileId}
                onDrop={(targetId) => {
                  if (!draggedTileId) return;
                  setTileOrder((current) => reorderTiles(current, draggedTileId, targetId));
                  setDraggedTileId(null);
                }}
              >
                {tiles[tileId]}
              </TileShell>
            ))}
          </div>
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
