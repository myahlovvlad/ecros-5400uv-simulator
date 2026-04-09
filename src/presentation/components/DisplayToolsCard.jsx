import React, { useMemo, useRef, useState } from "react";
import { LcdCanvas } from "./LcdCanvas.jsx";

function buildPresetName() {
  return `LCD ${new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
}

export function DisplayToolsCard({
  device,
  previewRows,
  presets,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
}) {
  const canvasRef = useRef(null);
  const [presetName, setPresetName] = useState(() => buildPresetName());
  const activePreviewRows = useMemo(() => previewRows ?? [], [previewRows]);

  const saveScreenshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const href = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = href;
    link.download = `ecros-display-${device.screen}.png`;
    link.click();
  };

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Инструменты дисплея</h2>
          <p className="text-sm text-zinc-500">Сохранение корректировок LCD, быстрый preview и экспорт скриншота.</p>
        </div>
        <button
          type="button"
          onClick={saveScreenshot}
          className="rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Сохранить скриншот
        </button>
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="space-y-3">
          <label className="block">
            <div className="mb-1 text-sm text-zinc-600">Имя корректировки</div>
            <input
              value={presetName}
              onChange={(event) => setPresetName(event.target.value)}
              className="w-full rounded-2xl border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              onSavePreset(presetName || buildPresetName());
              setPresetName(buildPresetName());
            }}
            className="w-full rounded-2xl border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            Сохранить корректировку
          </button>

          <div className="rounded-2xl bg-zinc-50 p-3 text-sm text-zinc-600">
            <div className="font-medium text-zinc-800">Preview</div>
            <div>Текущее окно: {device.screen}</div>
            <div>Строк дисплея: {activePreviewRows.filter((row) => row.text.trim()).length}</div>
          </div>
        </div>

        <div className="flex items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-950/5 p-4">
          <LcdCanvas device={device} rowsOverride={activePreviewRows} scale={3} canvasRef={canvasRef} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-semibold text-zinc-700">Сохранённые корректировки</div>
        {presets.length ? presets.map((preset) => (
          <div key={preset.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm">
            <div>
              <div className="font-medium text-zinc-800">{preset.name}</div>
              <div className="text-zinc-500">{preset.savedAt}</div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onLoadPreset(preset.id)}
                className="rounded-xl border border-zinc-300 px-3 py-1 hover:bg-white"
              >
                Загрузить
              </button>
              <button
                type="button"
                onClick={() => onDeletePreset(preset.id)}
                className="rounded-xl border border-rose-300 px-3 py-1 text-rose-700 hover:bg-rose-50"
              >
                Удалить
              </button>
            </div>
          </div>
        )) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 px-3 py-4 text-sm text-zinc-500">
            Сохранённых корректировок пока нет.
          </div>
        )}
      </div>
    </div>
  );
}
