import React from "react";

export const SCREEN_INDEX = {
  boot: "WND-01",
  diagnostic: "WND-02",
  warmup: "WND-03",
  main: "WND-04",
  photometry: "WND-05",
  photometryValue: "WND-06",
  photometryGraph: "WND-07",
  fileRoot: "WND-08",
  fileList: "WND-09",
  fileActionMenu: "WND-10",
  saveDialog: "WND-11",
  input: "WND-12",
  quantMain: "WND-13",
  quantUnits: "WND-14",
  quantCoef: "WND-15",
  calibrationSetupStandards: "WND-16",
  calibrationSetupParallels: "WND-17",
  calibrationPlan: "WND-18",
  calibrationStep: "WND-19",
  calibrationJournal: "WND-20",
  calibrationGraph: "WND-21",
  kineticsMenu: "WND-22",
  kineticsRun: "WND-23",
  kineticsGraph: "WND-24",
  settings: "WND-25",
  version: "WND-26",
  warning: "WND-27",
};

const FLOW_NODES = [
  { id: "boot", label: "Boot", x: 40, y: 36 },
  { id: "diagnostic", label: "Diagnostic", x: 220, y: 36 },
  { id: "warmup", label: "Warmup", x: 400, y: 36 },
  { id: "main", label: "Main Menu", x: 600, y: 36 },

  { id: "photometry", label: "Photometry", x: 40, y: 168 },
  { id: "photometryValue", label: "Value Mode", x: 40, y: 292 },
  { id: "photometryGraph", label: "Photo Graph", x: 40, y: 416 },

  { id: "quantMain", label: "Quant Main", x: 240, y: 168 },
  { id: "quantUnits", label: "Units", x: 240, y: 292 },
  { id: "quantCoef", label: "Coeff", x: 240, y: 416 },
  { id: "calibrationSetupStandards", label: "Calib Std", x: 240, y: 540 },
  { id: "calibrationSetupParallels", label: "Calib Par", x: 420, y: 540 },
  { id: "calibrationPlan", label: "Calib Plan", x: 600, y: 540 },
  { id: "calibrationStep", label: "Calib Step", x: 780, y: 540 },
  { id: "calibrationJournal", label: "Calib Journal", x: 780, y: 664 },
  { id: "calibrationGraph", label: "Calib Graph", x: 960, y: 664 },

  { id: "kineticsMenu", label: "Kinetics", x: 440, y: 168 },
  { id: "kineticsRun", label: "Run", x: 440, y: 292 },
  { id: "kineticsGraph", label: "Kinetics Graph", x: 440, y: 416 },

  { id: "settings", label: "Settings", x: 780, y: 168 },
  { id: "version", label: "Version", x: 960, y: 168 },

  { id: "fileRoot", label: "File Root", x: 960, y: 292 },
  { id: "fileList", label: "File List", x: 960, y: 416 },
  { id: "fileActionMenu", label: "File Actions", x: 960, y: 540 },
  { id: "saveDialog", label: "Save Dialog", x: 1140, y: 416 },
  { id: "input", label: "Input Dialog", x: 1140, y: 540 },
  { id: "warning", label: "Warning", x: 1140, y: 664 },
];

const EDGES = [
  ["boot", "diagnostic", "timer"],
  ["diagnostic", "warmup", "done"],
  ["warmup", "main", "ESC/timer"],
  ["main", "photometry", "enter"],
  ["main", "quantMain", "enter"],
  ["main", "kineticsMenu", "enter"],
  ["main", "settings", "enter"],

  ["photometry", "photometryValue", "set"],
  ["photometry", "photometryGraph", "down"],
  ["photometryValue", "photometry", "enter/esc"],
  ["photometryGraph", "photometry", "esc"],

  ["quantMain", "calibrationSetupStandards", "enter"],
  ["quantMain", "quantCoef", "enter"],
  ["quantMain", "quantUnits", "enter"],
  ["quantUnits", "quantMain", "esc"],
  ["quantCoef", "quantMain", "esc"],
  ["calibrationSetupStandards", "calibrationSetupParallels", "enter"],
  ["calibrationSetupParallels", "calibrationPlan", "enter"],
  ["calibrationPlan", "calibrationStep", "enter"],
  ["calibrationPlan", "calibrationJournal", "down"],
  ["calibrationStep", "calibrationPlan", "esc"],
  ["calibrationJournal", "calibrationPlan", "esc"],
  ["calibrationJournal", "calibrationGraph", "down*"],
  ["calibrationGraph", "calibrationJournal", "esc"],

  ["kineticsMenu", "kineticsRun", "start"],
  ["kineticsRun", "kineticsGraph", "down"],
  ["kineticsGraph", "kineticsRun", "esc"],

  ["settings", "version", "enter"],
  ["version", "settings", "esc"],

  ["main", "fileRoot", "file"],
  ["photometry", "fileRoot", "file"],
  ["quantMain", "fileList", "file"],
  ["kineticsMenu", "fileList", "file"],
  ["calibrationPlan", "fileList", "file"],
  ["fileRoot", "fileList", "enter"],
  ["fileList", "fileActionMenu", "enter"],
  ["fileActionMenu", "input", "rename"],
  ["photometry", "saveDialog", "save"],
  ["quantCoef", "saveDialog", "save"],
  ["calibrationStep", "saveDialog", "save"],
  ["calibrationJournal", "saveDialog", "save"],
  ["kineticsRun", "saveDialog", "save"],
];

function centerPoint(node) {
  return { x: node.x + 70, y: node.y + 34 };
}

export function ScenarioFlowMap({ currentScreen, onSelectScreen = null }) {
  const nodeMap = new Map(FLOW_NODES.map((node) => [node.id, node]));

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Ветки сценариев и окна</h2>
          <p className="text-sm text-zinc-500">Сквозная индексация экранов и основные переходы между окнами.</p>
        </div>
        <div className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700">
          Текущее окно: <span className="font-semibold">{SCREEN_INDEX[currentScreen] ?? "WND-??"}</span>
        </div>
      </div>

      <div className="mb-3 rounded-2xl border border-dashed border-zinc-300 px-3 py-2 text-xs text-zinc-500">
        Нажмите на карточку окна, чтобы перевести симулятор в соответствующий экран.
      </div>

      <div className="overflow-auto rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
        <div className="relative h-[780px] min-w-[1360px]">
          <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
            {EDGES.map(([from, to, label]) => {
              const start = centerPoint(nodeMap.get(from));
              const end = centerPoint(nodeMap.get(to));
              const midX = (start.x + end.x) / 2;
              const midY = (start.y + end.y) / 2;

              return (
                <g key={`${from}-${to}-${label}`}>
                  <path
                    d={`M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`}
                    fill="none"
                    stroke="rgba(20, 184, 166, 0.55)"
                    strokeWidth="2"
                  />
                  <text x={midX} y={midY - 6} textAnchor="middle" fontSize="11" fill="#475569">
                    {label}
                  </text>
                </g>
              );
            })}
          </svg>

          {FLOW_NODES.map((node) => {
            const active = node.id === currentScreen;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => onSelectScreen?.(node.id)}
                className={`absolute w-[140px] rounded-2xl border p-3 text-left text-sm shadow-sm transition hover:-translate-y-[1px] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  active
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-zinc-200 bg-white text-zinc-700"
                }`}
                style={{ left: node.x, top: node.y }}
                aria-pressed={active}
                title={`Перейти к окну ${SCREEN_INDEX[node.id]}`}
              >
                <div className={`text-[11px] font-semibold uppercase tracking-wide ${active ? "text-emerald-100" : "text-zinc-400"}`}>
                  {SCREEN_INDEX[node.id]}
                </div>
                <div className="mt-1 font-semibold">{node.label}</div>
                <div className={`mt-1 text-xs ${active ? "text-emerald-50" : "text-zinc-500"}`}>{node.id}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
