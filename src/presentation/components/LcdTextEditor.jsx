import React, { useEffect, useRef } from "react";
import { LCDRenderer } from "../../infrastructure/adapters/LcdRenderer.js";

const LCD_ROW_COUNT = 8;
const LCD_COL_COUNT = 20;
const LCD_X_MAX = 120;
const LCD_Y_MAX = 56;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildRowWarning(rowIndex, glyphs) {
  if (!glyphs?.length) return null;
  const first = glyphs[0];
  return `⚠ Строка ${rowIndex + 1}: символ '${first.char}' (${first.codepoint}) не в глифовой спецификации`;
}

function BitmapRowPreview({ value, invalidChars }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    LCDRenderer.renderTextPreview(ctx, value, {
      width: canvas.width,
      height: canvas.height,
      invalidChars,
    });
  }, [invalidChars, value]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Bitmap Preview</span>
        <span className="text-xs text-zinc-400">20 символов / 128×64 LCD</span>
      </div>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-[248px] rounded-lg border border-zinc-300 bg-white p-2 shadow-inner">
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            width={128}
            height={12}
            className="block h-6 w-64 [image-rendering:pixelated]"
          />
        </div>
      </div>
    </div>
  );
}

function NumericField({ label, value, min, max, ariaLabel, testId, onFocus, onChange }) {
  return (
    <label className="min-w-[76px] text-sm text-zinc-600">
      <div className="mb-1 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">{label}</div>
      <input
        aria-label={ariaLabel}
        data-testid={testId}
        type="number"
        value={value}
        min={min}
        max={max}
        onFocus={onFocus}
        onChange={onChange}
        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-emerald-500"
      />
    </label>
  );
}

export function normalizeLcdRows(rows) {
  return Array.from({ length: LCD_ROW_COUNT }, (_, index) => {
    const row = rows?.[index];
    return {
      text: String(row?.text ?? "").slice(0, LCD_COL_COUNT),
      inverted: Boolean(row?.inverted),
      x: clamp(Number.isFinite(row?.x) ? row.x : 3, 0, LCD_X_MAX),
      y: clamp(Number.isFinite(row?.y) ? row.y : 3 + index * 9, 0, LCD_Y_MAX),
    };
  });
}

export function LcdTextEditor({
  enabled,
  rows,
  warnings = [],
  options = { titleUnderline: false },
  selectedRowIndex,
  onToggle,
  onSelectRow,
  onChangeOptions,
  onChangeRow,
  onResetFromDevice,
  onClear,
  onExportPng,
  onExportFont,
}) {
  return (
    <div data-testid="lcd-editor" className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Редактор LCD</h2>
          <p className="text-sm text-zinc-500">
            Редактирование, позиционирование и bitmap-preview собраны в одну последовательную карточку строки без тесной сетки.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700">
          <input
            aria-label="Ручной режим LCD"
            data-testid="lcd-editor-manual-mode"
            type="checkbox"
            checked={enabled}
            onChange={(event) => onToggle(event.target.checked)}
            className="h-4 w-4 accent-emerald-600"
          />
          Ручной режим
        </label>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onResetFromDevice}
          data-testid="lcd-editor-load-device"
          className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
        >
          Загрузить из прибора
        </button>
        <button
          type="button"
          onClick={onClear}
          data-testid="lcd-editor-clear"
          className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
        >
          Очистить строки
        </button>
        <button
          type="button"
          onClick={onExportPng}
          data-testid="lcd-editor-export-png"
          className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
        >
          Экспорт LCD PNG
        </button>
        <button
          type="button"
          onClick={onExportFont}
          data-testid="lcd-editor-export-font"
          className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
        >
          Экспорт шрифта
        </button>
        <label className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700">
          <input
            aria-label="Подчёркивание заголовка"
            data-testid="lcd-editor-title-underline"
            type="checkbox"
            checked={Boolean(options.titleUnderline)}
            onChange={(event) => onChangeOptions?.({ titleUnderline: event.target.checked })}
            className="h-4 w-4 accent-emerald-600"
          />
          Подчёркивание заголовка
        </label>
      </div>

      <div className="mb-4 rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
        Каждая строка теперь редактируется сверху вниз: подпись, параметры, текст, затем preview. Строчные и прописные символы берутся из одной глифовой спецификации, а предупреждение появляется только для реально отсутствующих знаков.
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => {
          const warning = buildRowWarning(index, warnings[index]);
          const inversionDisabled = index === 0 && options.titleUnderline;

          return (
            <div
              key={index}
              onClick={() => onSelectRow(index)}
              data-testid={`lcd-editor-row-${index + 1}`}
              className={`rounded-3xl p-4 transition ${
                selectedRowIndex === index ? "bg-emerald-50 ring-2 ring-emerald-400" : "bg-zinc-50"
              }`}
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-zinc-700">Строка {index + 1}</div>
                  <div className="text-xs text-zinc-500">До {LCD_COL_COUNT} символов, ручное позиционирование по X/Y</div>
                </div>

                <div className="flex flex-wrap items-end gap-3">
                  <NumericField
                    label="X"
                    value={row.x}
                    min={0}
                    max={LCD_X_MAX}
                    ariaLabel={`Координата X строки ${index + 1}`}
                    testId={`lcd-row-x-${index + 1}`}
                    onFocus={() => onSelectRow(index)}
                    onChange={(event) => onChangeRow(index, { x: clamp(Number(event.target.value || 0), 0, LCD_X_MAX) })}
                  />
                  <NumericField
                    label="Y"
                    value={row.y}
                    min={0}
                    max={LCD_Y_MAX}
                    ariaLabel={`Координата Y строки ${index + 1}`}
                    testId={`lcd-row-y-${index + 1}`}
                    onFocus={() => onSelectRow(index)}
                    onChange={(event) => onChangeRow(index, { y: clamp(Number(event.target.value || 0), 0, LCD_Y_MAX) })}
                  />
                  <label className={`flex min-h-[42px] items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                    inversionDisabled ? "border-zinc-200 bg-zinc-100 text-zinc-400" : "border-zinc-300 bg-white text-zinc-700"
                  }`}>
                    <input
                      aria-label={`Инверсия строки ${index + 1}`}
                      data-testid={`lcd-row-invert-${index + 1}`}
                      type="checkbox"
                      checked={inversionDisabled ? false : row.inverted}
                      disabled={inversionDisabled}
                      onChange={(event) => onChangeRow(index, { inverted: event.target.checked })}
                      className="h-4 w-4 accent-emerald-600"
                    />
                    Инверсия
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block">
                  <div className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Текст строки</div>
                  <input
                    aria-label={`Строка ${index + 1}. До 20 символов`}
                    data-testid={`lcd-row-input-${index + 1}`}
                    value={row.text}
                    maxLength={LCD_COL_COUNT}
                    onFocus={() => onSelectRow(index)}
                    onChange={(event) => onChangeRow(index, { text: event.target.value.slice(0, LCD_COL_COUNT) })}
                    className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 font-mono text-sm text-zinc-900 outline-none transition focus:border-emerald-500"
                    placeholder={`До ${LCD_COL_COUNT} символов`}
                  />
                </label>

                <BitmapRowPreview value={row.text} invalidChars={warnings[index]} />
              </div>

              {warning ? (
                <div role="alert" className="mt-3 rounded-2xl bg-amber-100 px-3 py-2 text-sm text-amber-900">
                  {warning}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
