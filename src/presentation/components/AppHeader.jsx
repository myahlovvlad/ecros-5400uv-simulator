import React from "react";
import { LCD_SCALE } from "../../domain/constants/index.js";

export function AppHeader({ softwareVersion, hardwareVersion }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Симулятор ЭКРОС-5400УФ</h1>
          <p className="text-sm text-zinc-600">
            Bitmap-LCD рендер 128x64 по глифовой спецификации v2.2, журнал градуировки,
            USB-экспорт и графики на LCD.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-zinc-600">
          <span className="rounded-full bg-zinc-100 px-3 py-1">Диапазон: 190-1100 нм</span>
          <span className="rounded-full bg-zinc-100 px-3 py-1">LCD: 128x64 x {LCD_SCALE}</span>
          <span className="rounded-full bg-zinc-100 px-3 py-1">ПО {softwareVersion}</span>
          <span className="rounded-full bg-zinc-100 px-3 py-1">АП {hardwareVersion}</span>
        </div>
      </div>
    </div>
  );
}
