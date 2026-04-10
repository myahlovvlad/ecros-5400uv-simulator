/* eslint-disable react-refresh/only-export-components */
import React, { useMemo, useState } from "react";
import { LCD_TEXT_MAX_WIDTH, measureBitmapTextWidth } from "./LcdCanvas.jsx";

const LCD_ROW_COUNT = 8;
const LCD_COL_COUNT = 20;

export function normalizeLcdRows(rows) {
  return Array.from({ length: LCD_ROW_COUNT }, (_, index) => {
    const row = rows?.[index];
    return {
      text: String(row?.text ?? "").slice(0, LCD_COL_COUNT),
      inverted: Boolean(row?.inverted),
    };
  });
}

export function LcdTextEditor({
  device,
  enabled,
  rows,
  previewRows = null,
  editorMode = "preview",
  onEditorModeChange,
  sourceLabel = "Из прибора",
  onToggle,
  onChangeRow,
  onResetFromDevice,
  onClear,
  onCommitChanges,
}) {
  const editing = editorMode === "edit";
  const [showAllRows, setShowAllRows] = useState(false);
  const activeRowCount = useMemo(
    () => rows.filter((row) => row.text.trim() || row.inverted).length,
    [rows],
  );
  const lastUsedRowIndex = useMemo(
    () => rows.reduce((acc, row, index) => (row.text.trim() || row.inverted ? index : acc), -1),
    [rows],
  );
  const compactRowCount = Math.max(5, lastUsedRowIndex + 1);
  const visibleRowCount = showAllRows ? LCD_ROW_COUNT : Math.min(LCD_ROW_COUNT, compactRowCount);
  const rowIndexes = useMemo(
    () => Array.from({ length: visibleRowCount }, (_, index) => index),
    [visibleRowCount],
  );
  const hasHiddenRows = visibleRowCount < LCD_ROW_COUNT;
  const currentPreviewRows = previewRows ?? rows;
  const bufferStatusLabel = sourceLabel === "Из прибора" ? "синхронизирован с прибором" : sourceLabel;

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Редактор LCD</h2>
          <p className="text-sm text-zinc-500">Редактирование строк дисплея с live-preview, контролем пиксельной ширины и видимости строк.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-100 p-1 text-sm">
            <button
              type="button"
              onClick={() => onEditorModeChange?.("preview")}
              className={`rounded-full px-3 py-1.5 transition ${
                !editing ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Предпросмотр
            </button>
            <button
              type="button"
              onClick={() => onEditorModeChange?.("edit")}
              className={`rounded-full px-3 py-1.5 transition ${
                editing ? "bg-emerald-600 text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Редактирование
            </button>
          </div>

          <span
            className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600"
            title="Показывает состояние буфера редактора, а не переключатель источника."
          >
            Буфер: {bufferStatusLabel}
          </span>

          <button
            type="button"
            onClick={() => onToggle(!enabled)}
            title={enabled ? "Ручные строки сейчас напрямую подменяют экран прибора." : "Включает live-подмену LCD строками из редактора."}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition ${
              enabled ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${enabled ? "bg-white" : "bg-zinc-400"}`} />
            Применять к прибору
          </button>
        </div>
      </div>

      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onResetFromDevice}
            className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
          >
            Загрузить из прибора
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
          >
            Очистить строки
          </button>
          <button
            type="button"
            onClick={onCommitChanges}
            title="Сохраняет текущий буфер редактора в workspace, чтобы он восстановился после перезагрузки."
            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Сохранить в workspace
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          <div>Окно: {device?.screen ?? "n/a"}</div>
          <div>Режим: {editing ? "редактирование" : "предпросмотр"}</div>
          <div>Применение к панели: {enabled ? "включено" : "выключено"}</div>
          <div>Активных строк: {activeRowCount} из {LCD_ROW_COUNT}</div>
          <div>Пиксельный лимит строки: {LCD_TEXT_MAX_WIDTH}px</div>
        </div>

        {hasHiddenRows ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-zinc-300 px-3 py-2 text-xs text-zinc-500">
            <div>Показаны строки 1-{visibleRowCount}; пустые нижние строки скрыты, пока они не нужны.</div>
            <button
              type="button"
              onClick={() => setShowAllRows((current) => !current)}
              className="rounded-lg border border-zinc-300 px-2 py-1 text-zinc-700 hover:bg-zinc-50"
            >
              {showAllRows ? "Скрыть пустые" : "Показать все 8 строк"}
            </button>
          </div>
        ) : null}

        <div className="space-y-2">
          {rowIndexes.map((index) => {
            const row = rows[index];
            const previewRow = currentPreviewRows[index] ?? row;
            const visibleText = row.text.trimEnd();
            const pixelWidth = measureBitmapTextWidth(visibleText);
            const hasOverflow = pixelWidth > LCD_TEXT_MAX_WIDTH;
            const hasTrailingSpaces = row.text.length !== visibleText.length;

            return (
              <div key={index} className="grid gap-2 rounded-2xl bg-zinc-50 p-2">
                <div className="grid grid-cols-[72px_1fr_110px] items-center gap-2">
                  <div className="text-sm font-medium text-zinc-500">Строка {index + 1}</div>
                  <input
                    value={row.text}
                    maxLength={LCD_COL_COUNT}
                    onChange={(event) => onChangeRow(index, { text: event.target.value })}
                    className="rounded-xl border border-zinc-300 bg-white px-3 py-2 font-mono text-sm outline-none transition focus:border-emerald-500"
                    placeholder={`До ${LCD_COL_COUNT} символов`}
                  />
                  <label className="inline-flex items-center justify-end gap-2 text-sm text-zinc-600">
                    <input
                      type="checkbox"
                      checked={row.inverted}
                      onChange={(event) => onChangeRow(index, { inverted: event.target.checked })}
                      className="h-4 w-4 accent-emerald-600"
                    />
                    Инверсия
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pl-[74px] text-xs">
                  <span className={`${hasOverflow ? "font-semibold text-rose-600" : "text-zinc-500"}`}>
                    {row.text.length}/{LCD_COL_COUNT} симв., {pixelWidth}/{LCD_TEXT_MAX_WIDTH}px
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {hasTrailingSpaces ? (
                      <span
                        className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800"
                        title="Концевые пробелы хранятся в буфере, но на LCD не рисуются."
                      >
                        хвостовые пробелы не видны
                      </span>
                    ) : null}
                    {hasOverflow ? (
                      <span
                        className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-700"
                        title="Ширина строки превышает доступную ширину LCD и будет визуально обрезана."
                      >
                        visual overflow
                      </span>
                    ) : null}
                    {previewRow?.text?.trim() ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                        видно на экране
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-zinc-600">
                        строка пустая
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-zinc-300 px-3 py-2 text-xs text-zinc-500">
        {editing
          ? "Редактирование: правки сразу меняют preview. «Применять к прибору» включает live-подмену LCD, а «Сохранить в workspace» запоминает текущий буфер между сессиями."
          : "Предпросмотр: можно проверить реальные строки прибора, визуальную ширину, скрытые хвостовые пробелы и переполнение без live-подмены LCD."}
      </div>
    </div>
  );
}
