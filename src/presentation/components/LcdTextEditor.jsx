import React from "react";

const LCD_ROW_COUNT = 8;
const LCD_COL_COUNT = 20;

export function normalizeLcdRows(rows) {
  const normalized = Array.from({ length: LCD_ROW_COUNT }, (_, index) => {
    const row = rows?.[index];
    return {
      text: String(row?.text ?? "").slice(0, LCD_COL_COUNT),
      inverted: Boolean(row?.inverted),
    };
  });

  return normalized;
}

export function LcdTextEditor({
  enabled,
  rows,
  onToggle,
  onChangeRow,
  onResetFromDevice,
  onClear,
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Редактор LCD</h2>
          <p className="text-sm text-zinc-500">Ручной предпросмотр строк дисплея на боковой панели симулятора.</p>
        </div>
        <label className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => onToggle(event.target.checked)}
            className="h-4 w-4 accent-emerald-600"
          />
          Ручной режим
        </label>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
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
      </div>

      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={index} className="grid grid-cols-[56px_1fr_92px] items-center gap-2 rounded-2xl bg-zinc-50 p-2">
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
  );
}
