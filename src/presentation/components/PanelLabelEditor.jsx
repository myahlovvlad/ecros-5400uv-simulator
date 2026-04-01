import React, { useEffect, useMemo, useState } from "react";
import { PANEL_LABEL_DEFAULTS, PANEL_LABEL_FIELDS } from "./InstrumentPanel.jsx";

function escapeCString(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
}

export function PanelLabelEditor({ labels, selectedFieldId, onSelectField, onApplyField, onResetAll }) {
  const [copied, setCopied] = useState(false);
  const [draftLabels, setDraftLabels] = useState(labels);

  const groups = useMemo(() => {
    return PANEL_LABEL_FIELDS.reduce((acc, field) => {
      if (!acc[field.group]) acc[field.group] = [];
      acc[field.group].push(field);
      return acc;
    }, {});
  }, []);

  const selectedField = useMemo(() => {
    return PANEL_LABEL_FIELDS.find((field) => field.id === selectedFieldId) ?? PANEL_LABEL_FIELDS[0];
  }, [selectedFieldId]);

  useEffect(() => {
    setDraftLabels(labels);
  }, [labels]);

  const selectedDraftValue = draftLabels[selectedField.id] ?? "";
  const selectedAppliedValue = labels[selectedField.id] ?? "";
  const selectedDirty = selectedDraftValue !== selectedAppliedValue;

  const generatedCode = useMemo(() => {
    const lines = [
      "typedef struct {",
      "  const char *id;",
      "  const char *text;",
      "} panel_label_t;",
      "",
      "static const panel_label_t kPanelLabels[] = {",
    ];

    PANEL_LABEL_FIELDS.forEach((field) => {
      lines.push(`  { "${field.id}", "${escapeCString(labels[field.id] ?? "")}" },`);
    });

    lines.push("};");
    return lines.join("\n");
  }, [labels]);

  const handleCopy = async () => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Редактор надписей</h2>
            <p className="text-sm text-zinc-500">Надпись сначала меняется как черновик, затем применяется отдельной кнопкой для выбранного поля.</p>
          </div>
          <button
            type="button"
            onClick={() => onResetAll(PANEL_LABEL_DEFAULTS)}
            data-testid="label-editor-reset-all"
            className="rounded-xl border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50"
          >
            Сбросить всё
          </button>
        </div>

        <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">Активное поле</div>
          <div className="mb-2 text-sm font-medium text-zinc-800">{selectedField.label}</div>
          <input
            aria-label={`Надпись панели: ${selectedField.label}`}
            data-testid="label-editor-input"
            value={selectedDraftValue}
            onChange={(event) => setDraftLabels((current) => ({ ...current, [selectedField.id]: event.target.value }))}
            className="mb-3 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none transition focus:border-emerald-500"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onApplyField(selectedField.id, selectedDraftValue)}
              disabled={!selectedDirty}
              data-testid="label-editor-apply"
              className={`rounded-xl px-3 py-1.5 text-sm transition ${
                selectedDirty
                  ? "border border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700"
                  : "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400"
              }`}
            >
              Применить поле
            </button>
            <button
              type="button"
              onClick={() => setDraftLabels((current) => ({ ...current, [selectedField.id]: selectedAppliedValue }))}
              data-testid="label-editor-revert"
              className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
            >
              Отменить черновик
            </button>
            <div className={`rounded-full px-3 py-1 text-xs font-medium ${selectedDirty ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"}`}>
              {selectedDirty ? "Есть черновик" : "Поле применено"}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(groups).map(([group, fields]) => (
            <div key={group} className="rounded-2xl bg-zinc-50 p-3">
              <div className="mb-3 text-sm font-semibold text-zinc-700">{group}</div>
              <div className="flex flex-wrap gap-2">
                {fields.map((field) => {
                  const dirty = (draftLabels[field.id] ?? "") !== (labels[field.id] ?? "");

                  return (
                    <button
                      key={field.id}
                      type="button"
                      data-testid={`label-editor-field-${field.id}`}
                      onClick={() => onSelectField(field.id)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition ${
                        field.id === selectedField.id
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : dirty
                            ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                            : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
                      }`}
                    >
                      {field.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Генератор C-кода</h2>
            <p className="text-sm text-zinc-500">Показывает только применённые надписи панели.</p>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-xl bg-emerald-600 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-700"
          >
            {copied ? "Скопировано" : "Копировать"}
          </button>
        </div>
        <textarea
          aria-label="Сгенерированный C-код надписей панели"
          readOnly
          value={generatedCode}
          className="min-h-[360px] w-full rounded-2xl border border-zinc-200 bg-zinc-950 p-3 font-mono text-xs text-emerald-300 outline-none"
        />
      </div>
    </div>
  );
}
