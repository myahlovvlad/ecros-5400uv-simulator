import React from "react";

const NODES = [
  { id: "boot", label: "BOOT" },
  { id: "diagnostic", label: "DIAG" },
  { id: "warmup", label: "WARMUP" },
  { id: "main", label: "MAIN" },
  { id: "fileRoot", label: "FILE ROOT" },
  { id: "fileList", label: "FILE LIST" },
  { id: "fileActionMenu", label: "FILE ACTION" },
  { id: "photometry", label: "ФОТО" },
  { id: "photometryValue", label: "ФОТО VALUE" },
  { id: "photometryGraph", label: "ФОТО GRAPH" },
  { id: "quantMain", label: "КОЛИЧ" },
  { id: "quantCoef", label: "KOEF" },
  { id: "quantUnits", label: "UNITS" },
  { id: "calibrationSetupStandards", label: "CAL STD" },
  { id: "calibrationSetupParallels", label: "CAL PAR" },
  { id: "calibrationPlan", label: "CAL PLAN" },
  { id: "calibrationStep", label: "CAL STEP" },
  { id: "calibrationJournal", label: "CAL LOG" },
  { id: "calibrationGraph", label: "CAL GRAPH" },
  { id: "kineticsMenu", label: "КИНЕТИКА" },
  { id: "kineticsRun", label: "KIN RUN" },
  { id: "kineticsGraph", label: "KIN GRAPH" },
  { id: "multiwaveMenu", label: "МНОГОВОЛН" },
  { id: "multiwaveWaveCount", label: "MW COUNT" },
  { id: "multiwaveWaveEntry", label: "MW λ" },
  { id: "multiwaveValue", label: "MW VALUE" },
  { id: "multiwaveResults", label: "MW RESULT" },
  { id: "settings", label: "SETTINGS" },
  { id: "version", label: "VERSION" },
  { id: "input", label: "INPUT" },
  { id: "saveDialog", label: "SAVE" },
  { id: "warning", label: "WARNING" },
];

export function MenuTreeGraph({ currentScreen }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Граф меню</h2>
        <div className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
          Текущий экран: {currentScreen}
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {NODES.map((node) => {
          const active = node.id === currentScreen;
          return (
            <div
              key={node.id}
              className={`rounded-2xl border px-3 py-2 text-sm font-medium transition ${
                active
                  ? "border-emerald-700 bg-emerald-600 text-white"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700"
              }`}
            >
              <div className="text-[11px] uppercase tracking-[0.18em] opacity-70">{node.id}</div>
              <div>{node.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
