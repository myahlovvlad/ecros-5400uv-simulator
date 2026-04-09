import React from "react";

export function MeasurementTable({ measurements, cursor, screen, onGenerateTest }) {
  const visibleMeasurements = measurements.slice(-8);

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Последние результаты</h2>
          <div className="text-sm text-zinc-500">Вниз после последней строки открывает график на LCD</div>
        </div>
        {onGenerateTest ? (
          <button
            type="button"
            onClick={onGenerateTest}
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50"
          >
            Сгенерировать тест
          </button>
        ) : null}
      </div>
      <div className="overflow-hidden rounded-2xl border border-zinc-200">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-3 py-2 text-left">№</th>
              <th className="px-3 py-2 text-left">λ, нм</th>
              <th className="px-3 py-2 text-left">Энергия</th>
              <th className="px-3 py-2 text-left">A</th>
              <th className="px-3 py-2 text-left">%T</th>
            </tr>
          </thead>
          <tbody>
            {visibleMeasurements.map((measurement, index) => {
              const globalIndex = Math.max(0, measurements.length - visibleMeasurements.length) + index;
              const active = globalIndex === cursor && screen === "photometry";
              return (
                <tr key={measurement.index} className={`border-t border-zinc-100 ${active ? "bg-zinc-900 text-white" : ""}`}>
                  <td className="px-3 py-2">{measurement.index}</td>
                  <td className="px-3 py-2">{measurement.wavelength.toFixed(1)}</td>
                  <td className="px-3 py-2">{measurement.energy}</td>
                  <td className="px-3 py-2">{measurement.a.toFixed(3)}</td>
                  <td className="px-3 py-2">{measurement.t.toFixed(1)}</td>
                </tr>
              );
            })}
            {measurements.length === 0 ? (
              <tr>
                <td className="px-3 py-8 text-center text-zinc-400" colSpan={5}>Результатов пока нет</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
