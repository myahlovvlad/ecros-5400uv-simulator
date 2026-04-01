import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  getBitmapGlyphMatrix,
  LCDRenderer,
  normalizeGlyphMatrix,
  splitBitmapText,
} from "../../infrastructure/adapters/LcdRenderer.js";

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
  return `Строка ${rowIndex + 1}: символ '${first.char}' (${first.codepoint}) отсутствует в bitmap-шрифте`;
}

function areRowsEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function areGlyphsEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function BitmapRowPreview({ value, invalidChars, glyphOverrides }) {
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
      glyphOverrides,
    });
  }, [glyphOverrides, invalidChars, value]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Bitmap Preview</span>
        <span className="text-xs text-zinc-400">20 символов / 128x64 LCD</span>
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

function NumericField({ label, value, min, max, ariaLabel, testId, disabled = false, onFocus, onChange }) {
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
        disabled={disabled}
        onFocus={onFocus}
        onChange={onChange}
        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${
          disabled
            ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
            : "border-zinc-300 bg-white text-zinc-900 focus:border-emerald-500"
        }`}
      />
    </label>
  );
}

function PixelGlyphEditor({
  activeChar,
  activeGlyph,
  appliedGlyph,
  glyphDirty,
  onTogglePixel,
  onApply,
  onResetDraft,
  onResetApplied,
  disabled = false,
}) {
  if (!activeChar || !activeGlyph) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h3 className="text-base font-semibold">Редактор буквы</h3>
        <p className="mt-2 text-sm text-zinc-500">Выберите строку и конкретный символ, чтобы редактировать его пиксельное отображение.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Редактор буквы</h3>
          <p className="text-sm text-zinc-500">Override применяется глобально ко всем вхождениям символа `{activeChar}` в bitmap-шрифте.</p>
        </div>
        <div className={`rounded-full px-3 py-1 text-xs font-medium ${glyphDirty ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"}`}>
          {glyphDirty ? "Есть черновик буквы" : "Буква применена"}
        </div>
      </div>

      <div className="mb-4 overflow-auto rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${activeGlyph[0]?.length ?? 1}, minmax(0, 1fr))` }}
        >
          {activeGlyph.flatMap((row, rowIndex) =>
            row.map((pixel, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                type="button"
                data-testid={`glyph-pixel-${rowIndex}-${colIndex}`}
                onClick={() => onTogglePixel(rowIndex, colIndex)}
                disabled={disabled}
                className={`h-8 w-8 rounded-md border transition ${
                  disabled
                    ? pixel
                      ? "cursor-not-allowed border-zinc-700 bg-zinc-700"
                      : "cursor-not-allowed border-zinc-200 bg-zinc-100"
                    : pixel
                      ? "border-zinc-900 bg-zinc-900"
                      : "border-zinc-300 bg-white hover:bg-zinc-100"
                }`}
                aria-label={`Пиксель ${rowIndex + 1}:${colIndex + 1}`}
              />
            )),
          )}
        </div>
      </div>

      <div className="mb-3 grid gap-3 text-sm text-zinc-600 md:grid-cols-2">
        <div className="rounded-2xl bg-zinc-50 p-3">Текущий символ: <span className="font-semibold text-zinc-900">{activeChar}</span></div>
        <div className="rounded-2xl bg-zinc-50 p-3">Ширина glyph: <span className="font-semibold text-zinc-900">{activeGlyph[0]?.length ?? 0}px</span></div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onApply}
          disabled={disabled || !glyphDirty}
          data-testid="glyph-apply"
          className={`rounded-xl px-3 py-1.5 text-sm transition ${
            !disabled && glyphDirty
              ? "border border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700"
              : "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400"
          }`}
        >
          Применить букву
        </button>
        <button
          type="button"
          onClick={onResetDraft}
          disabled={disabled}
          data-testid="glyph-reset-draft"
          className={`rounded-xl px-3 py-1.5 text-sm transition ${
            disabled
              ? "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400"
              : "border border-zinc-300 hover:bg-zinc-50"
          }`}
        >
          Отменить черновик
        </button>
        <button
          type="button"
          onClick={onResetApplied}
          disabled={disabled || !appliedGlyph}
          data-testid="glyph-reset-applied"
          className={`rounded-xl px-3 py-1.5 text-sm transition ${
            !disabled && appliedGlyph
              ? "border border-zinc-300 bg-white hover:bg-zinc-50"
              : "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400"
          }`}
        >
          Сбросить букву к шрифту
        </button>
      </div>
    </div>
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
  options = { titleUnderline: false },
  glyphOverrides = {},
  selectedRowIndex,
  hasGlobalUnsavedChanges = false,
  onToggle,
  onSelectRow,
  onApplyRow,
  onResetRow,
  onApplyOptions,
  onLoadDevice,
  onClearApplied,
  onExportPng,
  onExportScreenC,
  onExportFontC,
  onApplyGlyph,
  onResetGlyph,
}) {
  const [draftRows, setDraftRows] = useState(rows);
  const [draftOptions, setDraftOptions] = useState(options);
  const [draftGlyphOverrides, setDraftGlyphOverrides] = useState(glyphOverrides);
  const [selectedGlyphIndex, setSelectedGlyphIndex] = useState(0);

  useEffect(() => {
    setDraftRows(rows);
  }, [rows]);

  useEffect(() => {
    setDraftOptions(options);
  }, [options]);

  useEffect(() => {
    setDraftGlyphOverrides(glyphOverrides);
  }, [glyphOverrides]);

  const draftWarnings = useMemo(
    () => draftRows.map((row) => LCDRenderer.getUnmappedGlyphs(row.text, { glyphOverrides: draftGlyphOverrides })),
    [draftGlyphOverrides, draftRows],
  );

  const selectedRow = draftRows[selectedRowIndex] ?? draftRows[0];
  const selectedChars = useMemo(
    () => splitBitmapText(selectedRow?.text ?? "").map((char, index) => ({ char, index })).filter(({ char }) => char.trim()),
    [selectedRow?.text],
  );

  useEffect(() => {
    if (!selectedChars.length) {
      setSelectedGlyphIndex(0);
      return;
    }

    setSelectedGlyphIndex((current) => Math.min(current, selectedChars.length - 1));
  }, [selectedChars]);

  const activeChar = selectedChars[selectedGlyphIndex]?.char ?? null;
  const baseGlyph = useMemo(
    () => (activeChar ? getBitmapGlyphMatrix(activeChar) : null),
    [activeChar],
  );
  const appliedGlyph = useMemo(
    () => (activeChar && glyphOverrides[activeChar] ? normalizeGlyphMatrix(glyphOverrides[activeChar], baseGlyph?.[0]?.length ?? null) : null),
    [activeChar, baseGlyph, glyphOverrides],
  );
  const activeGlyph = useMemo(() => {
    if (!activeChar || !baseGlyph) return null;
    const draftGlyph = draftGlyphOverrides[activeChar];
    return normalizeGlyphMatrix(draftGlyph ?? baseGlyph, baseGlyph[0]?.length ?? null);
  }, [activeChar, baseGlyph, draftGlyphOverrides]);

  const glyphDirty = useMemo(() => {
    if (!activeChar || !baseGlyph || !activeGlyph) return false;
    const normalizedApplied = normalizeGlyphMatrix(appliedGlyph ?? baseGlyph, baseGlyph[0]?.length ?? null);
    return !areGlyphsEqual(activeGlyph, normalizedApplied);
  }, [activeChar, activeGlyph, appliedGlyph, baseGlyph]);

  const titleDirty = Boolean(draftOptions.titleUnderline) !== Boolean(options.titleUnderline);

  const updateDraftRow = (index, patch) => {
    setDraftRows((current) => current.map((row, rowIndex) => (
      rowIndex === index ? { ...row, ...patch } : row
    )));
  };

  const handleToggleGlyphPixel = (rowIndex, colIndex) => {
    if (!activeChar || !baseGlyph || !activeGlyph) return;
    setDraftGlyphOverrides((current) => {
      const nextGlyph = normalizeGlyphMatrix(current[activeChar] ?? activeGlyph, activeGlyph[0]?.length ?? null).map((row) => [...row]);
      nextGlyph[rowIndex][colIndex] = nextGlyph[rowIndex][colIndex] ? 0 : 1;
      return {
        ...current,
        [activeChar]: nextGlyph,
      };
    });
  };

  const handleResetGlyphDraft = () => {
    if (!activeChar) return;
    setDraftGlyphOverrides((current) => {
      const next = { ...current };
      if (glyphOverrides[activeChar]) {
        next[activeChar] = normalizeGlyphMatrix(glyphOverrides[activeChar]);
      } else {
        delete next[activeChar];
      }
      return next;
    });
  };

  return (
    <div data-testid="lcd-editor" className="space-y-4">
      <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Редактор LCD</h2>
            <p className="text-sm text-zinc-500">Черновики редактируются локально. На экран симулятора попадают только применённые строки и применённые override-глифы.</p>
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
            onClick={onLoadDevice}
            data-testid="lcd-editor-load-device"
            disabled={!enabled}
            className={`rounded-xl px-3 py-1.5 text-sm transition ${
              enabled
                ? "border border-zinc-300 hover:bg-zinc-50"
                : "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400"
            }`}
          >
            Загрузить из прибора
          </button>
          <button
            type="button"
            onClick={onClearApplied}
            data-testid="lcd-editor-clear"
            disabled={!enabled}
            className={`rounded-xl px-3 py-1.5 text-sm transition ${
              enabled
                ? "border border-zinc-300 hover:bg-zinc-50"
                : "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400"
            }`}
          >
            Очистить применённое
          </button>
          <button
            type="button"
            onClick={onExportPng}
            data-testid="lcd-editor-export-png"
            className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
          >
            Скачать PNG
          </button>
          <button
            type="button"
            onClick={onExportScreenC}
            data-testid="lcd-editor-export-screen-c"
            className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
          >
            Скачать C-экран
          </button>
          <button
            type="button"
            onClick={onExportFontC}
            data-testid="lcd-editor-export-font-c"
            className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
          >
            Скачать C-шрифт
          </button>
          <div className={`rounded-full px-3 py-1 text-xs font-medium ${hasGlobalUnsavedChanges ? "bg-amber-100 text-amber-900" : "bg-zinc-100 text-zinc-700"}`}>
            {hasGlobalUnsavedChanges ? "Есть несохранённые глобальные изменения" : "Глобальное состояние синхронизировано"}
          </div>
        </div>

        <div className="rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Каждая строка редактируется как черновик. Используйте кнопку `Применить строку`, чтобы отправить её на LCD, и `Сохранить всё` в workspace, чтобы зафиксировать изменения глобально.
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Параметры LCD</h3>
            <p className="text-sm text-zinc-500">Параметры заголовка также подтверждаются отдельно.</p>
          </div>
          <div className={`rounded-full px-3 py-1 text-xs font-medium ${titleDirty ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"}`}>
            {titleDirty ? "Есть черновик параметров" : "Параметры применены"}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700">
            <input
              aria-label="Подчёркивание заголовка"
              data-testid="lcd-editor-title-underline"
              type="checkbox"
              checked={Boolean(draftOptions.titleUnderline)}
              disabled={!enabled}
              onChange={(event) => setDraftOptions({ titleUnderline: event.target.checked })}
              className="h-4 w-4 accent-emerald-600"
            />
            Подчёркивание заголовка
          </label>
          <button
            type="button"
            onClick={() => onApplyOptions(draftOptions)}
            disabled={!enabled || !titleDirty}
            data-testid="lcd-editor-apply-options"
            className={`rounded-xl px-3 py-1.5 text-sm transition ${
              enabled && titleDirty
                ? "border border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700"
                : "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400"
            }`}
          >
            Применить параметр
          </button>
          <button
            type="button"
            onClick={() => setDraftOptions(options)}
            disabled={!enabled}
            data-testid="lcd-editor-reset-options"
            className={`rounded-xl px-3 py-1.5 text-sm transition ${
              enabled
                ? "border border-zinc-300 hover:bg-zinc-50"
                : "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400"
            }`}
          >
            Отменить черновик
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {draftRows.map((row, index) => {
          const warning = buildRowWarning(index, draftWarnings[index]);
          const inversionDisabled = index === 0 && draftOptions.titleUnderline;
          const rowDirty = !areRowsEqual(row, rows[index]);

          return (
            <div
              key={index}
              onClick={() => onSelectRow(index)}
              data-testid={`lcd-editor-row-${index + 1}`}
              className={`rounded-3xl border p-4 transition ${
                selectedRowIndex === index
                  ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-300"
                  : "border-zinc-200 bg-white"
              }`}
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-zinc-700">Строка {index + 1}</div>
                  <div className="text-xs text-zinc-500">До {LCD_COL_COUNT} символов, ручное позиционирование по X/Y</div>
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-medium ${rowDirty ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"}`}>
                  {rowDirty ? "Черновик строки" : "Строка применена"}
                </div>
              </div>

              <div className="mb-3 flex flex-wrap items-end gap-3">
                <NumericField
                  label="X"
                  value={row.x}
                  min={0}
                  max={LCD_X_MAX}
                  ariaLabel={`Координата X строки ${index + 1}`}
                  testId={`lcd-row-x-${index + 1}`}
                  disabled={!enabled}
                  onFocus={() => onSelectRow(index)}
                  onChange={(event) => updateDraftRow(index, { x: clamp(Number(event.target.value || 0), 0, LCD_X_MAX) })}
                />
                <NumericField
                  label="Y"
                  value={row.y}
                  min={0}
                  max={LCD_Y_MAX}
                  ariaLabel={`Координата Y строки ${index + 1}`}
                  testId={`lcd-row-y-${index + 1}`}
                  disabled={!enabled}
                  onFocus={() => onSelectRow(index)}
                  onChange={(event) => updateDraftRow(index, { y: clamp(Number(event.target.value || 0), 0, LCD_Y_MAX) })}
                />
                <label className={`flex min-h-[42px] items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                  inversionDisabled ? "border-zinc-200 bg-zinc-100 text-zinc-400" : "border-zinc-300 bg-white text-zinc-700"
                }`}>
                  <input
                    aria-label={`Инверсия строки ${index + 1}`}
                    data-testid={`lcd-row-invert-${index + 1}`}
                    type="checkbox"
                    checked={inversionDisabled ? false : row.inverted}
                    disabled={!enabled || inversionDisabled}
                    onChange={(event) => updateDraftRow(index, { inverted: event.target.checked })}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  Инверсия
                </label>
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
                    disabled={!enabled}
                    onChange={(event) => updateDraftRow(index, { text: event.target.value.slice(0, LCD_COL_COUNT) })}
                    className={`w-full rounded-2xl border px-4 py-3 font-mono text-sm outline-none transition ${
                      enabled
                        ? "border-zinc-300 bg-white text-zinc-900 focus:border-emerald-500"
                        : "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-500"
                    }`}
                    placeholder={`До ${LCD_COL_COUNT} символов`}
                  />
                </label>

                <BitmapRowPreview
                  value={row.text}
                  invalidChars={draftWarnings[index]}
                  glyphOverrides={draftGlyphOverrides}
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onApplyRow(index, row)}
                  disabled={!enabled || !rowDirty}
                  data-testid={`lcd-row-apply-${index + 1}`}
                  className={`rounded-xl px-3 py-1.5 text-sm transition ${
                    enabled && rowDirty
                      ? "border border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700"
                      : "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400"
                  }`}
                >
                  Применить строку
                </button>
                <button
                  type="button"
                  onClick={() => setDraftRows((current) => current.map((draftRow, rowIndex) => (rowIndex === index ? rows[index] : draftRow)))}
                  disabled={!enabled}
                  data-testid={`lcd-row-reset-${index + 1}`}
                  className={`rounded-xl px-3 py-1.5 text-sm transition ${
                    enabled
                      ? "border border-zinc-300 hover:bg-zinc-50"
                      : "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400"
                  }`}
                >
                  Отменить черновик
                </button>
                <button
                  type="button"
                  onClick={() => onResetRow(index)}
                  disabled={!enabled}
                  data-testid={`lcd-row-reset-applied-${index + 1}`}
                  className={`rounded-xl px-3 py-1.5 text-sm transition ${
                    enabled
                      ? "border border-zinc-300 hover:bg-zinc-50"
                      : "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400"
                  }`}
                >
                  Сбросить применённую строку
                </button>
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

      <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mb-3">
          <h3 className="text-base font-semibold">Выбор символа</h3>
          <p className="text-sm text-zinc-500">Выберите символ из активной строки и отредактируйте его как bitmap-glyph.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedChars.length ? selectedChars.map(({ char, index }) => (
            <button
              key={`${char}-${index}`}
              type="button"
              data-testid={`glyph-char-${index}`}
              onClick={() => setSelectedGlyphIndex(index)}
              disabled={!enabled}
              className={`rounded-xl border px-3 py-1.5 text-sm transition ${
                !enabled
                  ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
                  : selectedGlyphIndex === index
                  ? "border-emerald-700 bg-emerald-600 text-white"
                  : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {char} #{index + 1}
            </button>
          )) : (
            <div className="rounded-xl bg-zinc-100 px-3 py-2 text-sm text-zinc-500">В активной строке нет символов для редактирования.</div>
          )}
        </div>
      </div>

      <PixelGlyphEditor
        activeChar={activeChar}
        activeGlyph={activeGlyph}
        appliedGlyph={appliedGlyph}
        glyphDirty={glyphDirty}
        onTogglePixel={handleToggleGlyphPixel}
        onApply={() => {
          if (!activeChar || !activeGlyph) return;
          onApplyGlyph(activeChar, activeGlyph);
        }}
        onResetDraft={handleResetGlyphDraft}
        onResetApplied={() => {
          if (!activeChar) return;
          onResetGlyph(activeChar);
          setDraftGlyphOverrides((current) => {
            const next = { ...current };
            delete next[activeChar];
            return next;
          });
        }}
        disabled={!enabled}
      />
    </div>
  );
}
