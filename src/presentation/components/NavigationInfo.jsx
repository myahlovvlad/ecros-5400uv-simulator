import React from "react";
import { FILE_GROUPS } from "../../domain/constants/index.js";
import { getCalibrationDoneCount } from "../../domain/usecases/index.js";

export function NavigationInfo({ device }) {
  const selectedFile = (device.files[device.fileContext.group] || [])[device.fileListIndex];
  const calibrationDone = getCalibrationDoneCount(device.calibration.plan);

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">Навигация и файлы</h2>
      <div className="space-y-2 text-sm text-zinc-700">
        <div className="rounded-2xl bg-zinc-50 p-3">Файл: {device.fileContext.group} {selectedFile ? `→ ${selectedFile.name}${selectedFile.ext}` : ""}</div>
        <div className="rounded-2xl bg-zinc-50 p-3">Доступные разделы: {FILE_GROUPS.join(", ")}</div>
        <div className="rounded-2xl bg-zinc-50 p-3">Новая градуировка: {device.calibration.standards} стандартов × {device.calibration.parallels} параллелей</div>
        <div className="rounded-2xl bg-zinc-50 p-3">Шагов выполнено: {calibrationDone} / {device.calibration.plan.length}</div>
        <div className="rounded-2xl bg-zinc-50 p-3">LCD рисуется статическим bitmap-шрифтом по спецификации v2.2 без canvas-fallback.</div>
      </div>
    </div>
  );
}
