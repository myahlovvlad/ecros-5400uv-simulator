import React from "react";

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

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Редактор LCD</h2>
          <p className="text-sm text-zinc-500">Редактирование строк дисплея с живым bitmap-предпросмотром.</p>
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

          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
            Источник: {sourceLabel}
          </span>

          <button
            type="button"
            onClick={() => onToggle(!enabled)}
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
            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Зафиксировать изменения
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          <div>Окно: {device?.screen ?? "n/a"}</div>
          <div>Режим: {editing ? "редактирование" : "предпросмотр"}</div>
          <div>Применение к панели: {enabled ? "включено" : "выключено"}</div>
        </div>

        <div className="space-y-2">
          {rows.map((row, index) => (
            <div key={index} className="grid grid-cols-[72px_1fr_110px] items-center gap-2 rounded-2xl bg-zinc-50 p-2">
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
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-zinc-300 px-3 py-2 text-xs text-zinc-500">
        {editing
          ? "Режим редактирования: правки сразу меняют preview, а кнопка фиксации сохраняет текущее состояние в workspace."
          : "Режим предпросмотра: realtime preview остаётся главным акцентом, но строки и инверсия всё равно доступны для правки без дополнительной блокировки."}
      </div>
    </div>
  );
}
