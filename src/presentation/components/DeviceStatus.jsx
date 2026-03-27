import React from "react";
import { SAMPLE_OPTIONS } from "../../domain/constants/index.js";

export function DeviceStatus({
  device,
  onReset,
  onSampleChange,
  onToggleD2Lamp,
  onToggleWLamp,
  onRezero,
  onMeasure,
  onDarkCurrent,
  onCalibrateWl,
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Состояние прибора</h2>
          <button onClick={onReset} className="rounded-xl border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50">
            Полный сброс
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-zinc-50 p-3"><div className="text-zinc-500">Длина волны</div><div className="text-xl font-semibold">{device.wavelength.toFixed(1)} нм</div></div>
          <div className="rounded-2xl bg-zinc-50 p-3"><div className="text-zinc-500">Усиление</div><div className="text-xl font-semibold">{device.gain}</div></div>
          <div className="rounded-2xl bg-zinc-50 p-3"><div className="text-zinc-500">Энергия</div><div className="text-xl font-semibold">{device.lastEnergy}</div></div>
          <div className="rounded-2xl bg-zinc-50 p-3"><div className="text-zinc-500">Режим</div><div className="text-xl font-semibold">{device.screen}</div></div>
          <div className="rounded-2xl bg-zinc-50 p-3"><div className="text-zinc-500">А</div><div className="text-xl font-semibold">{device.lastComputedA.toFixed(3)}</div></div>
          <div className="rounded-2xl bg-zinc-50 p-3"><div className="text-zinc-500">%Т</div><div className="text-xl font-semibold">{device.lastComputedT.toFixed(1)}</div></div>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Виртуальный образец</h2>
        <div className="space-y-3 text-sm">
          <label className="block">
            <div className="mb-1 text-zinc-500">Что находится в луче</div>
            <select value={device.currentSample} onChange={(event) => onSampleChange(event.target.value)} className="w-full rounded-2xl border border-zinc-300 px-3 py-2">
              {SAMPLE_OPTIONS.map((sample) => (
                <option key={sample.value} value={sample.value}>{sample.label}</option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="rounded-2xl bg-zinc-50 p-3">
              <div className="mb-1 text-zinc-500">Д2-лампа</div>
              <input type="checkbox" checked={device.d2Lamp} onChange={(event) => onToggleD2Lamp(event.target.checked)} />
            </label>
            <label className="rounded-2xl bg-zinc-50 p-3">
              <div className="mb-1 text-zinc-500">В-лампа</div>
              <input type="checkbox" checked={device.wLamp} onChange={(event) => onToggleWLamp(event.target.checked)} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button onClick={onRezero} className="rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              Кнопка НОЛЬ
            </button>
            <button onClick={onMeasure} className="rounded-2xl border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50">
              Кнопка START
            </button>
            <button onClick={onDarkCurrent} className="rounded-2xl border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50">
              Темновой ток
            </button>
            <button onClick={onCalibrateWl} className="rounded-2xl border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50">
              Калибровка λ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
