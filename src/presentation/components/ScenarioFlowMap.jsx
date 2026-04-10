import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  SCREEN_FLOW_EDGES,
  SCREEN_FLOW_NODES,
  SCREEN_INDEX,
} from "../../application/services/screenFlow.js";
import { debugError } from "../utils/debug.js";

const GRAPH_BASE_W = 1360;
const GRAPH_BASE_H = 780;

function centerPoint(node) {
  return { x: node.x + 70, y: node.y + 34 };
}

export function ScenarioFlowMap({ currentScreen, onSelectScreen = null }) {
  const nodeMap = useMemo(
    () => new Map(SCREEN_FLOW_NODES.map((node) => [node.id, node])),
    [],
  );
  const viewportRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [fitMode, setFitMode] = useState(true);

  useEffect(() => {
    let observer = null;
    const observedElement = viewportRef.current;

    const cleanup = () => {
      if (!observer) return;
      try {
        if (observedElement) observer.unobserve(observedElement);
      } catch (error) {
        debugError("ScenarioFlowMap.ResizeObserver.unobserve", error);
      }
      observer.disconnect();
    };

    if (!fitMode || typeof ResizeObserver === "undefined") {
      return cleanup;
    }

    const updateZoom = () => {
      try {
        const width = viewportRef.current?.clientWidth ?? GRAPH_BASE_W;
        setZoom(Math.min(1, Math.max(0.62, (width - 32) / GRAPH_BASE_W)));
      } catch (error) {
        debugError("ScenarioFlowMap.updateZoom", error);
      }
    };

    try {
      updateZoom();
      observer = new ResizeObserver(() => {
        try {
          updateZoom();
        } catch (error) {
          debugError("ScenarioFlowMap.ResizeObserver.callback", error);
        }
      });
      if (observedElement) observer.observe(observedElement);
    } catch (error) {
      debugError("ScenarioFlowMap.ResizeObserver", error);
    }

    return cleanup;
  }, [fitMode]);

  const setFixedZoom = (value) => {
    setFitMode(false);
    setZoom(value);
  };

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Ветки сценариев и окна</h2>
          <p className="text-sm text-zinc-500">Сквозная индексация экранов, доступные переходы и быстрый переход к нужному окну.</p>
        </div>
        <div className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700">
          Текущее окно: <span className="font-semibold">{SCREEN_INDEX[currentScreen] ?? "WND-??"}</span>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-zinc-300 px-3 py-2 text-xs text-zinc-500">
        <div>Нажмите на карточку окна, чтобы перевести симулятор в соответствующий экран.</div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFitMode(true)}
            className={`rounded-lg border px-2 py-1 ${
              fitMode ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            Подогнать
          </button>
          <button
            type="button"
            onClick={() => setFixedZoom(0.85)}
            className={`rounded-lg border px-2 py-1 ${
              !fitMode && zoom === 0.85 ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            85%
          </button>
          <button
            type="button"
            onClick={() => setFixedZoom(1)}
            className={`rounded-lg border px-2 py-1 ${
              !fitMode && zoom === 1 ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            100%
          </button>
        </div>
      </div>

      <div ref={viewportRef} className="overflow-auto rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
        <div className="mb-2 text-[11px] text-zinc-500">
          {fitMode ? "Граф автоматически подгоняется под ширину окна." : "Для полного обзора используйте горизонтальную прокрутку контейнера."}
        </div>

        <div
          className="relative"
          style={{
            width: `${GRAPH_BASE_W * zoom}px`,
            height: `${GRAPH_BASE_H * zoom}px`,
          }}
        >
          <div
            className="relative origin-top-left"
            style={{
              width: GRAPH_BASE_W,
              height: GRAPH_BASE_H,
              transform: `scale(${zoom})`,
            }}
          >
            <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
              {SCREEN_FLOW_EDGES.map(([from, to, label]) => {
                const startNode = nodeMap.get(from);
                const endNode = nodeMap.get(to);
                if (!startNode || !endNode) return null;
                const start = centerPoint(startNode);
                const end = centerPoint(endNode);
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

            {SCREEN_FLOW_NODES.map((node) => {
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
    </div>
  );
}
