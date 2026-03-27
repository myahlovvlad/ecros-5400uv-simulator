import React, { useEffect, useMemo, useState } from "react";
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
import { getLcdRows } from "../../infrastructure/adapters/LcdRenderer.js";

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
  } = useDevice();

  const [panelLabels, setPanelLabels] = useState(PANEL_LABEL_DEFAULTS);
  const [selectedFieldId, setSelectedFieldId] = useState("titleLeft");
  const [lcdEditorEnabled, setLcdEditorEnabled] = useState(false);
  const liveLcdRows = useMemo(() => normalizeLcdRows(getLcdRows(device)), [device]);
  const [lcdEditorRows, setLcdEditorRows] = useState(liveLcdRows);
  const resolvedLabels = useMemo(() => ({ ...PANEL_LABEL_DEFAULTS, ...panelLabels }), [panelLabels]);
  const lcdRowsOverride = lcdEditorEnabled ? lcdEditorRows : null;

  useEffect(() => {
    if (!lcdEditorEnabled) setLcdEditorRows(liveLcdRows);
  }, [lcdEditorEnabled, liveLcdRows]);

  return (
    <div className="min-h-screen bg-zinc-100 p-4 text-zinc-900">
      <div className="mx-auto max-w-[2600px] space-y-4">
        <AppHeader softwareVersion={device.softwareVersion} hardwareVersion={device.hardwareVersion} />

        <div className="grid gap-4 xl:grid-cols-[minmax(780px,1120px)_380px_460px]">
          <InstrumentPanel
            device={device}
            onAction={handleAction}
            labels={resolvedLabels}
            selectedFieldId={selectedFieldId}
            onSelectField={setSelectedFieldId}
            lcdRowsOverride={lcdRowsOverride}
          />

          <div className="space-y-4">
            <LcdTextEditor
              enabled={lcdEditorEnabled}
              rows={lcdEditorRows}
              onToggle={(checked) => {
                setLcdEditorEnabled(checked);
                if (checked) setLcdEditorRows(liveLcdRows);
              }}
              onChangeRow={(index, patch) => {
                setLcdEditorRows((current) => current.map((row, rowIndex) => (
                  rowIndex === index ? { ...row, ...patch } : row
                )));
              }}
              onResetFromDevice={() => setLcdEditorRows(liveLcdRows)}
              onClear={() => setLcdEditorRows(normalizeLcdRows([]))}
            />
            <PanelLabelEditor
              labels={resolvedLabels}
              selectedFieldId={selectedFieldId}
              onSelectField={setSelectedFieldId}
              onChange={(id, value) => setPanelLabels((current) => ({ ...current, [id]: value }))}
              onReset={(value) => {
                setPanelLabels(value);
                setSelectedFieldId("titleLeft");
              }}
            />
            <DeviceStatus
              device={device}
              onReset={resetAll}
              onSampleChange={(value) => setDevice((d) => ({ ...d, currentSample: value }))}
              onToggleD2Lamp={(checked) => setDevice((d) => ({ ...d, d2Lamp: checked }))}
              onToggleWLamp={(checked) => setDevice((d) => ({ ...d, wLamp: checked }))}
              onRezero={performRezero}
              onMeasure={performPhotometryMeasure}
              onDarkCurrent={performDarkCurrent}
              onCalibrateWl={performWavelengthCalibration}
            />

            <MeasurementTable measurements={device.measurements} cursor={device.measurementCursor} screen={device.screen} />
          </div>

          <div className="space-y-4">
            <CliEmulator logLines={device.logLines} onExecute={executeCli} />
            <UsbExportPanel device={device} onSelect={(index) => setDevice((d) => ({ ...d, usbPreviewIndex: index }))} />
            <NavigationInfo device={device} />
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
