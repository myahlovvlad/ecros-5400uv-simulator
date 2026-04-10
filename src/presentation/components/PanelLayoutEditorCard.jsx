/* eslint-disable react-refresh/only-export-components */
import React, { useMemo } from "react";
import { getPanelSelectionBounds, getVisiblePanelElementIds } from "./InstrumentPanel.jsx";

const LAYOUT_FIELDS = [
  { key: "topButtonWidth", label: "Ширина верхних кнопок", min: 72, max: 140, step: 2 },
  { key: "topButtonHeight", label: "Высота верхних кнопок", min: 42, max: 84, step: 2 },
  { key: "digitButtonSize", label: "Размер цифровых кнопок", min: 60, max: 110, step: 2 },
  { key: "navButtonSize", label: "Размер стрелок / ESC", min: 60, max: 120, step: 2 },
  { key: "sideButtonWidth", label: "Ширина правой колонки", min: 80, max: 150, step: 2 },
  { key: "sideButtonHeight", label: "Высота правой колонки", min: 48, max: 90, step: 2 },
  { key: "lcdScale", label: "Масштаб LCD", min: 2.4, max: 4.8, step: 0.1 },
];

const ALIGN_ACTIONS = [
  { key: "left", label: "По левому" },
  { key: "center", label: "По центру X" },
  { key: "right", label: "По правому" },
  { key: "top", label: "По верхнему" },
  { key: "middle", label: "По центру Y" },
  { key: "bottom", label: "По нижнему" },
];

export const DEFAULT_PANEL_LAYOUT = {
  topButtonWidth: 92,
  topButtonHeight: 60,
  digitButtonSize: 88,
  navButtonSize: 88,
  sideButtonWidth: 108,
  sideButtonHeight: 66,
  gapX: 12,
  gapY: 12,
  clusterWidth: 860,
  lcdScale: 3.5,
};

function NumericField({ label, value, onChange, disabled, step = 0.1 }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <input
        type="number"
        step={step}
        value={Number.isFinite(value) ? value.toFixed(step >= 1 ? 0 : 1) : ""}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm disabled:bg-zinc-100 disabled:text-zinc-400"
      />
    </label>
  );
}

export function PanelLayoutEditorCard({
  mode,
  layout,
  onChange,
  onReset,
  onResetElementLayout = null,
  elementLayout = null,
  selectedElementIds = [],
  onUpdateSelectionGeometry = null,
  onAlignSelection = null,
  onDeleteSelection = null,
}) {
  const isCanvasMode = mode === "canvas" || mode === "edit";
  const selectionBounds = useMemo(() => getPanelSelectionBounds(elementLayout, selectedElementIds), [elementLayout, selectedElementIds]);
  const visibleCount = useMemo(() => getVisiblePanelElementIds(elementLayout ?? {}).length, [elementLayout]);
  const hiddenCount = Math.max(0, Object.keys(elementLayout ?? {}).length - visibleCount);

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Редактор геометрии панели</h2>
          <p className="text-sm text-zinc-500">
            Режим холста поддерживает мультивыбор, точное позиционирование, направляющие и удаление объектов как в редакторе слайдов.
          </p>
        </div>
        <div className="flex gap-2">
          {onResetElementLayout ? (
            <button type="button" onClick={onResetElementLayout} className="rounded-xl border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50">
              Сбросить объекты
            </button>
          ) : null}
          <button type="button" onClick={onReset} className="rounded-xl border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50">
            Сбросить размеры
          </button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 rounded-2xl bg-zinc-50 p-3 text-sm text-zinc-600">
        <div>Режим: <span className="font-semibold text-zinc-900">{isCanvasMode ? "Холст" : "Симуляция"}</span></div>
        <div>Выделено объектов: <span className="font-semibold text-zinc-900">{selectedElementIds.length}</span></div>
        <div>Скрыто объектов: <span className="font-semibold text-zinc-900">{hiddenCount}</span></div>
        <div className="text-xs">Мультивыбор: `Shift + click` или рамкой мышью. Удаление: `Delete`.</div>
      </div>

      {isCanvasMode ? (
        <div className="mb-5 space-y-4 rounded-2xl border border-zinc-200 p-3">
          <div className="text-sm font-semibold text-zinc-800">Выделение</div>
          {selectionBounds ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <NumericField label="X" value={selectionBounds.x} onChange={(value) => onUpdateSelectionGeometry?.({ x: value })} disabled={!onUpdateSelectionGeometry} />
                <NumericField label="Y" value={selectionBounds.y} onChange={(value) => onUpdateSelectionGeometry?.({ y: value })} disabled={!onUpdateSelectionGeometry} />
                <NumericField label="W" value={selectionBounds.w} onChange={(value) => onUpdateSelectionGeometry?.({ w: value })} disabled={!onUpdateSelectionGeometry} />
                <NumericField label="H" value={selectionBounds.h} onChange={(value) => onUpdateSelectionGeometry?.({ h: value })} disabled={!onUpdateSelectionGeometry} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ALIGN_ACTIONS.map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    onClick={() => onAlignSelection?.(action.key)}
                    disabled={!onAlignSelection || selectedElementIds.length < 2}
                    className="rounded-xl border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onDeleteSelection?.()}
                disabled={!onDeleteSelection || !selectedElementIds.length}
                className="w-full rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Удалить выделенные
              </button>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-300 px-3 py-4 text-sm text-zinc-500">
              Выберите один или несколько объектов на панели.
            </div>
          )}
        </div>
      ) : null}

      <div className="space-y-4">
        {LAYOUT_FIELDS.map((field) => (
          <label
            key={field.key}
            className={`block transition ${isCanvasMode ? "" : "opacity-45"}`}
            title={isCanvasMode ? field.label : "Переключитесь в режим холста, чтобы менять геометрию панели."}
          >
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-zinc-700">{field.label}</span>
              <span className="font-medium text-zinc-500">{layout[field.key]}</span>
            </div>
            <input
              type="range"
              min={field.min}
              max={field.max}
              step={field.step}
              disabled={!isCanvasMode}
              value={layout[field.key]}
              onChange={(event) => onChange(field.key, field.step < 1 ? parseFloat(event.target.value) : Number(event.target.value))}
              className="w-full cursor-pointer accent-emerald-600 disabled:cursor-not-allowed"
            />
            {!isCanvasMode ? (
              <div className="mt-1 text-[11px] text-zinc-400">
                Доступно только в режиме холста.
              </div>
            ) : null}
          </label>
        ))}
      </div>
    </div>
  );
}
