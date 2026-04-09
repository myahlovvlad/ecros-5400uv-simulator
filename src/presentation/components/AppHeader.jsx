import React from "react";
import { LCD_SCALE } from "../../domain/constants/index.js";

export function AppHeader({
  softwareVersion,
  hardwareVersion,
  mode = "simulation",
  onModeChange = null,
  paused = false,
  onTogglePause = null,
  onSaveAll = null,
  canSave = false,
  saveStatus = "",
}) {
  const isCanvasMode = mode === "canvas" || mode === "edit";

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Симулятор ЭКРОС-5400УФ</h1>
          <p className="text-sm text-zinc-600">
            Два глобальных режима: рабочая симуляция прибора и режим холста для свободной компоновки блоков как на слайде.
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 xl:items-end">
          <div className="flex flex-wrap gap-2 text-xs text-zinc-600">
            <span className="rounded-full bg-zinc-100 px-3 py-1">Диапазон: 190-1100 нм</span>
            <span className="rounded-full bg-zinc-100 px-3 py-1">LCD: 128x64 x {LCD_SCALE}</span>
            <span className="rounded-full bg-zinc-100 px-3 py-1">ПО {softwareVersion}</span>
            <span className="rounded-full bg-zinc-100 px-3 py-1">АП {hardwareVersion}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onModeChange ? (
              <div className="flex rounded-2xl border border-zinc-300 bg-zinc-50 p-1">
                <button
                  type="button"
                  onClick={() => onModeChange("simulation")}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                    !isCanvasMode ? "bg-emerald-600 text-white" : "text-zinc-700 hover:bg-white"
                  }`}
                >
                  Режим симуляции
                </button>
                <button
                  type="button"
                  onClick={() => onModeChange("canvas")}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                    isCanvasMode ? "bg-emerald-600 text-white" : "text-zinc-700 hover:bg-white"
                  }`}
                >
                  Режим холста
                </button>
              </div>
            ) : null}

            {onTogglePause ? (
              <button
                type="button"
                onClick={onTogglePause}
                className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                  paused
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
                }`}
              >
                {paused ? "Продолжить" : "Пауза"}
              </button>
            ) : null}

            {saveStatus ? <span className="text-sm text-zinc-500">{saveStatus}</span> : null}

            {onSaveAll ? (
              <button
                type="button"
                onClick={onSaveAll}
                disabled={!canSave}
                className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                  canSave
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "cursor-not-allowed bg-zinc-200 text-zinc-500"
                }`}
              >
                Сохранить всё
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
