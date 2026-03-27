import React from "react";

export function UsbExportPanel({ device, onSelect }) {
  const selectedExport = device.usbExports[device.usbPreviewIndex] || null;

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">USB-накопитель</h2>
      <div className="mb-3 grid gap-3 lg:grid-cols-[180px_1fr]">
        <div className="space-y-2">
          {device.usbExports.length === 0 ? (
            <div className="rounded-2xl bg-zinc-50 p-3 text-sm text-zinc-500">Экспортов пока нет</div>
          ) : (
            device.usbExports.map((item, index) => (
              <button
                key={item.id}
                onClick={() => onSelect(index)}
                className={`w-full rounded-2xl border px-3 py-2 text-left text-sm ${index === device.usbPreviewIndex ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-zinc-50"}`}
              >
                <div className="font-medium">{item.name}{item.ext}</div>
                <div className="text-xs opacity-80">{item.group} → {item.target}</div>
              </button>
            ))
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-950 p-3 font-mono text-xs text-emerald-300">
          {selectedExport ? (
            <>
              <div className="mb-2 text-zinc-300">Последний просмотр: {selectedExport.exportedAt}</div>
              <pre className="max-h-[280px] overflow-auto whitespace-pre-wrap break-words">{selectedExport.content}</pre>
            </>
          ) : (
            <div className="text-zinc-500">Здесь появится предпросмотр данных, экспортированных на внешний USB-накопитель.</div>
          )}
        </div>
      </div>
    </div>
  );
}
