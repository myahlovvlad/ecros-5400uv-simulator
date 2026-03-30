import React from "react";

const NODES = [
  { id: "boot", label: "BOOT", x: 20, y: 20 },
  { id: "diagnostic", label: "DIAG", x: 140, y: 20 },
  { id: "warmup", label: "WARMUP", x: 260, y: 20 },
  { id: "main", label: "MAIN", x: 400, y: 20 },
  { id: "fileRoot", label: "FILE ROOT", x: 540, y: 20 },
  { id: "fileList", label: "FILE LIST", x: 680, y: 20 },
  { id: "fileActionMenu", label: "FILE ACTION", x: 680, y: 90 },
  { id: "photometry", label: "ФОТО", x: 20, y: 140 },
  { id: "photometryValue", label: "ФОТО VALUE", x: 20, y: 210 },
  { id: "photometryGraph", label: "ФОТО GRAPH", x: 20, y: 280 },
  { id: "quantMain", label: "КОЛИЧ", x: 180, y: 140 },
  { id: "quantCoef", label: "KOEF", x: 180, y: 210 },
  { id: "quantUnits", label: "UNITS", x: 180, y: 280 },
  { id: "calibrationSetupStandards", label: "CAL STD", x: 320, y: 140 },
  { id: "calibrationSetupParallels", label: "CAL PAR", x: 320, y: 210 },
  { id: "calibrationPlan", label: "CAL PLAN", x: 460, y: 140 },
  { id: "calibrationStep", label: "CAL STEP", x: 460, y: 210 },
  { id: "calibrationJournal", label: "CAL LOG", x: 460, y: 280 },
  { id: "calibrationGraph", label: "CAL GRAPH", x: 460, y: 350 },
  { id: "kineticsMenu", label: "КИНЕТИКА", x: 20, y: 390 },
  { id: "kineticsRun", label: "KIN RUN", x: 160, y: 390 },
  { id: "kineticsGraph", label: "KIN GRAPH", x: 300, y: 390 },
  { id: "multiwaveMenu", label: "МНОГОВОЛН", x: 180, y: 470 },
  { id: "multiwaveWaveCount", label: "MW COUNT", x: 340, y: 470 },
  { id: "multiwaveWaveEntry", label: "MW λ", x: 500, y: 470 },
  { id: "multiwaveValue", label: "MW VALUE", x: 660, y: 470 },
  { id: "multiwaveResults", label: "MW RESULT", x: 660, y: 540 },
  { id: "settings", label: "SETTINGS", x: 620, y: 180 },
  { id: "version", label: "VERSION", x: 620, y: 250 },
  { id: "input", label: "INPUT", x: 780, y: 250 },
  { id: "saveDialog", label: "SAVE", x: 780, y: 320 },
  { id: "warning", label: "WARNING", x: 780, y: 390 },
];

const EDGES = [
  ["boot", "diagnostic"],
  ["diagnostic", "warmup"],
  ["warmup", "main"],
  ["main", "photometry"],
  ["main", "quantMain"],
  ["main", "kineticsMenu"],
  ["main", "multiwaveMenu"],
  ["main", "settings"],
  ["main", "fileRoot"],
  ["fileRoot", "fileList"],
  ["fileList", "fileActionMenu"],
  ["fileActionMenu", "fileList"],
  ["photometry", "photometryValue"],
  ["photometry", "photometryGraph"],
  ["photometry", "saveDialog"],
  ["quantMain", "quantCoef"],
  ["quantMain", "quantUnits"],
  ["quantMain", "calibrationSetupStandards"],
  ["quantMain", "input"],
  ["quantCoef", "input"],
  ["quantCoef", "saveDialog"],
  ["calibrationSetupStandards", "calibrationSetupParallels"],
  ["calibrationSetupParallels", "calibrationPlan"],
  ["calibrationPlan", "calibrationStep"],
  ["calibrationPlan", "calibrationJournal"],
  ["calibrationStep", "calibrationJournal"],
  ["calibrationJournal", "calibrationGraph"],
  ["calibrationJournal", "saveDialog"],
  ["calibrationGraph", "saveDialog"],
  ["kineticsMenu", "input"],
  ["kineticsMenu", "kineticsRun"],
  ["kineticsRun", "kineticsGraph"],
  ["kineticsRun", "saveDialog"],
  ["multiwaveMenu", "multiwaveWaveCount"],
  ["multiwaveMenu", "multiwaveWaveEntry"],
  ["multiwaveMenu", "multiwaveValue"],
  ["multiwaveMenu", "multiwaveResults"],
  ["multiwaveWaveCount", "input"],
  ["multiwaveWaveEntry", "input"],
  ["multiwaveResults", "saveDialog"],
  ["settings", "version"],
  ["settings", "warning"],
  ["input", "warning"],
  ["saveDialog", "warning"],
];

const NODE_W = 108;
const NODE_H = 42;

function getNodeCenter(node) {
  return {
    x: node.x + NODE_W / 2,
    y: node.y + NODE_H / 2,
  };
}

export function MenuTreeGraph({ currentScreen }) {
  const nodeById = new Map(NODES.map((node) => [node.id, node]));

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Граф меню</h2>
        <div className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
          Текущий экран: {currentScreen}
        </div>
      </div>
      <div className="overflow-auto rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
        <svg viewBox="0 0 920 620" className="min-w-[860px]">
          {EDGES.map(([fromId, toId]) => {
            const from = nodeById.get(fromId);
            const to = nodeById.get(toId);
            if (!from || !to) return null;
            const fromCenter = getNodeCenter(from);
            const toCenter = getNodeCenter(to);
            const active = currentScreen === fromId || currentScreen === toId;

            return (
              <line
                key={`${fromId}-${toId}`}
                x1={fromCenter.x}
                y1={fromCenter.y}
                x2={toCenter.x}
                y2={toCenter.y}
                stroke={active ? "#047857" : "#94a3b8"}
                strokeWidth={active ? 3 : 1.5}
                strokeLinecap="round"
              />
            );
          })}

          {NODES.map((node) => {
            const active = node.id === currentScreen;
            return (
              <g key={node.id}>
                <rect
                  x={node.x}
                  y={node.y}
                  rx="12"
                  ry="12"
                  width={NODE_W}
                  height={NODE_H}
                  fill={active ? "#047857" : "#ffffff"}
                  stroke={active ? "#065f46" : "#cbd5e1"}
                  strokeWidth={active ? 3 : 1.5}
                />
                <text
                  x={node.x + NODE_W / 2}
                  y={node.y + 24}
                  textAnchor="middle"
                  fontSize="11"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                  fill={active ? "#ffffff" : "#0f172a"}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
