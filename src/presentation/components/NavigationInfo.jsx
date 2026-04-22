import React from "react";
import { FILE_GROUPS } from "../../domain/constants/index.js";
import { SCREEN_FLOW_EDGES, SCREEN_INDEX } from "../../domain/constants/screens.js";
import { getCalibrationDoneCount } from "../../domain/usecases/index.js";
import { LCD_TEXT_MAX_WIDTH } from "./LcdCanvas.jsx";

export function NavigationInfo({ device, onCalibrationChange }) {
  const selectedFile = (device.files[device.fileContext.group] || [])[device.fileListIndex];
  const calibrationDone = getCalibrationDoneCount(device.calibration.plan);
  const calibrationTotal = device.calibration.plan.length || 1;
  const progressValue = Math.round((calibrationDone / calibrationTotal) * 100);
  const outgoingTransitions = SCREEN_FLOW_EDGES.filter(([from, to]) => from === device.screen && to !== "warningReturn");

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">Навигация, файлы и лимиты UI</h2>
      <div className="space-y-3 text-sm text-zinc-700">
        <div className="rounded-2xl bg-zinc-50 p-3">Файл: {device.fileContext.group} {selectedFile ? `→ ${selectedFile.name}${selectedFile.ext}` : ""}</div>
        <div className="rounded-2xl bg-zinc-50 p-3">Доступные разделы: {FILE_GROUPS.join(", ")}</div>
        <div className="rounded-2xl bg-zinc-50 p-3">
          <div className="mb-2 font-medium text-zinc-800">Текущее окно и переходы</div>
          <div>Сейчас: <span className="font-semibold">{SCREEN_INDEX[device.screen] ?? "WND-??"} / {device.screen}</span></div>
          <div className="mt-2 space-y-1 text-xs text-zinc-600">
            {outgoingTransitions.length ? outgoingTransitions.map(([from, to, label]) => (
              <div key={`${from}-${to}-${label}`} className="rounded-xl bg-white px-2 py-1">
                {label} → <span className="font-medium">{SCREEN_INDEX[to] ?? "WND-??"} / {to}</span>
              </div>
            )) : (
              <div className="rounded-xl bg-white px-2 py-1">Для этого окна отдельные переходы не описаны.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-zinc-50 p-3">
          <div className="mb-2 font-medium text-zinc-800">Новая градуировка</div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Стандарты</div>
              <input
                type="number"
                min={1}
                max={9}
                value={device.calibration.standards}
                onChange={(event) => onCalibrationChange("standards", Number(event.target.value))}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <div className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Параллели</div>
              <input
                type="number"
                min={1}
                max={9}
                value={device.calibration.parallels}
                onChange={(event) => onCalibrationChange("parallels", Number(event.target.value))}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2"
              />
            </label>
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            План пересчитывается для {device.calibration.standards} × {device.calibration.parallels}
          </div>
        </div>

        <div className="rounded-2xl bg-zinc-50 p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="font-medium text-zinc-800">Шагов выполнено</span>
            <span>{calibrationDone} / {calibrationTotal}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-zinc-200">
            <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${progressValue}%` }} />
          </div>
          <div className="mt-2 text-xs text-zinc-500">{progressValue}% завершено</div>
        </div>

        <div className="rounded-2xl bg-zinc-50 p-3">
          <div className="mb-2 font-medium text-zinc-800">Лимиты полей</div>
          <div className="text-xs text-zinc-600">LCD: до 8 строк, до 20 символов в буфере, до {LCD_TEXT_MAX_WIDTH}px видимой ширины без обрезания.</div>
          <div className="mt-1 text-xs text-zinc-600">Калибровка: стандарты 1–9, параллели 1–9.</div>
          <div className="mt-1 text-xs text-zinc-600">Числовой ввод длины волны проверяется по диапазону прибора.</div>
        </div>
      </div>
    </div>
  );
}
