import React from "react";
import { LcdCanvas } from "./LcdCanvas.jsx";

export const PANEL_LABEL_DEFAULTS = {
  titleLeft: "СПЕКТРОФОТОМЕТР",
  titleRight: "ЭКРОС-5400УФ",
  file: "ФАЙЛ",
  clear: "ОЧИСТИТЬ",
  print: "ПЕЧАТЬ",
  params: "ПАРАМЕТРЫ",
  goto: "ПЕРЕХОД Λ",
  zero: "НОЛЬ",
  startMain: "START",
  startSub: "СТОП",
  enter: "ВВОД",
  esc: "ESC",
  digit1: "1",
  digit2: "2",
  digit2Sub: "АБВ",
  digit3: "3",
  digit3Sub: "ДЕЖ",
  digit4: "4",
  digit4Sub: "ЗИЙ",
  digit5: "5",
  digit5Sub: "КЛМ",
  digit6: "6",
  digit6Sub: "НОП",
  digit7: "7",
  digit7Sub: "РСТУ",
  digit8: "8",
  digit8Sub: "ФХЦЧ",
  digit9: "9",
  digit9Sub: "ШЩЫЯ",
  digit0: "0",
  digitDot: ".",
  digitMinus: "-",
};

export const PANEL_LABEL_FIELDS = [
  { id: "titleLeft", label: "Заголовок слева", group: "Заголовок" },
  { id: "titleRight", label: "Заголовок справа", group: "Заголовок" },
  { id: "file", label: "ФАЙЛ", group: "Основные кнопки" },
  { id: "clear", label: "ОЧИСТИТЬ", group: "Основные кнопки" },
  { id: "print", label: "ПЕЧАТЬ", group: "Основные кнопки" },
  { id: "params", label: "ПАРАМЕТРЫ", group: "Основные кнопки" },
  { id: "goto", label: "ПЕРЕХОД Λ", group: "Правый столбец" },
  { id: "zero", label: "НОЛЬ", group: "Правый столбец" },
  { id: "startMain", label: "START", group: "Правый столбец" },
  { id: "startSub", label: "Подпись START", group: "Правый столбец" },
  { id: "enter", label: "ВВОД", group: "Правый столбец" },
  { id: "esc", label: "ESC", group: "Навигация" },
  { id: "digit1", label: "Клавиша 1", group: "Цифровая клавиатура" },
  { id: "digit2", label: "Клавиша 2", group: "Цифровая клавиатура" },
  { id: "digit2Sub", label: "Подпись 2", group: "Цифровая клавиатура" },
  { id: "digit3", label: "Клавиша 3", group: "Цифровая клавиатура" },
  { id: "digit3Sub", label: "Подпись 3", group: "Цифровая клавиатура" },
  { id: "digit4", label: "Клавиша 4", group: "Цифровая клавиатура" },
  { id: "digit4Sub", label: "Подпись 4", group: "Цифровая клавиатура" },
  { id: "digit5", label: "Клавиша 5", group: "Цифровая клавиатура" },
  { id: "digit5Sub", label: "Подпись 5", group: "Цифровая клавиатура" },
  { id: "digit6", label: "Клавиша 6", group: "Цифровая клавиатура" },
  { id: "digit6Sub", label: "Подпись 6", group: "Цифровая клавиатура" },
  { id: "digit7", label: "Клавиша 7", group: "Цифровая клавиатура" },
  { id: "digit7Sub", label: "Подпись 7", group: "Цифровая клавиатура" },
  { id: "digit8", label: "Клавиша 8", group: "Цифровая клавиатура" },
  { id: "digit8Sub", label: "Подпись 8", group: "Цифровая клавиатура" },
  { id: "digit9", label: "Клавиша 9", group: "Цифровая клавиатура" },
  { id: "digit9Sub", label: "Подпись 9", group: "Цифровая клавиатура" },
  { id: "digit0", label: "Клавиша 0", group: "Цифровая клавиатура" },
  { id: "digitDot", label: "Клавиша .", group: "Цифровая клавиатура" },
  { id: "digitMinus", label: "Клавиша -", group: "Цифровая клавиатура" },
];

const TOP_BUTTONS = [
  { id: "file", action: "FILE" },
  { id: "clear", action: "CLEAR" },
  { id: "print", action: "PRINT" },
  { id: "params", action: "SET" },
];

const DIGIT_ROWS = [
  [
    { id: "digit1", action: "1" },
    { id: "digit2", action: "2", subId: "digit2Sub" },
    { id: "digit3", action: "3", subId: "digit3Sub" },
  ],
  [
    { id: "digit4", action: "4", subId: "digit4Sub" },
    { id: "digit5", action: "5", subId: "digit5Sub" },
    { id: "digit6", action: "6", subId: "digit6Sub" },
  ],
  [
    { id: "digit7", action: "7", subId: "digit7Sub" },
    { id: "digit8", action: "8", subId: "digit8Sub" },
    { id: "digit9", action: "9", subId: "digit9Sub" },
  ],
  [
    { id: "digit0", action: "0" },
    { id: "digitDot", action: "." },
    { id: "digitMinus", action: "-" },
  ],
];

const SIDE_BUTTONS = [
  { id: "goto", action: "GOTOλ" },
  { id: "zero", action: "ZERO" },
  { id: "startMain", action: "START/STOP", subId: "startSub" },
  { id: "enter", action: "ENTER" },
];

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function TitlePlate({ text, selected, onSelect, widthClass }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cx(
        "rounded-[22px] px-6 py-3 text-left text-white transition",
        "bg-emerald-500/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]",
        selected && "ring-2 ring-white/80 ring-offset-2 ring-offset-emerald-700",
        widthClass,
      )}
    >
      <span className="block truncate text-[clamp(18px,2vw,34px)] font-semibold tracking-[0.08em]">{text}</span>
    </button>
  );
}

function PanelButton({ text, subtext, shape = "rect", selected, onClick, onSelect, textClassName = "" }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        onSelect?.();
        onClick?.(event);
      }}
      className={cx(
        "group relative flex items-center justify-center overflow-hidden border border-stone-300/90 bg-stone-100 text-emerald-700",
        "shadow-[6px_8px_0_rgba(0,0,0,0.12)] transition duration-150 hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_3px_0_rgba(0,0,0,0.12)]",
        shape === "round" ? "aspect-square rounded-full" : "rounded-2xl",
        selected && "ring-2 ring-amber-300 ring-offset-2 ring-offset-emerald-700",
      )}
    >
      <div className="pointer-events-none absolute inset-x-[8%] top-[8%] h-[28%] rounded-full bg-white/55 blur-sm" />
      <span className={cx("relative z-10 flex flex-col items-center justify-center px-2 text-center leading-tight", textClassName)}>
        <span className="text-[clamp(14px,1.25vw,22px)] font-semibold">{text}</span>
        {subtext ? <span className="text-[clamp(9px,0.8vw,12px)] font-medium uppercase tracking-wide opacity-80">{subtext}</span> : null}
      </span>
    </button>
  );
}

function ArrowButton({ direction, onClick }) {
  const up = direction === "up";
  return (
    <button
      type="button"
      aria-label={up ? "Вверх" : "Вниз"}
      onClick={onClick}
      className="group relative aspect-square rounded-full border border-stone-300/90 bg-stone-100 text-emerald-700 shadow-[6px_8px_0_rgba(0,0,0,0.12)] transition duration-150 hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_3px_0_rgba(0,0,0,0.12)]"
    >
      <div className="absolute inset-x-[10%] top-[10%] h-[28%] rounded-full bg-white/55 blur-sm" />
      <div
        className={cx(
          "absolute left-1/2 top-1/2 h-0 w-0 -translate-x-1/2 -translate-y-1/2 border-x-[16px] border-x-transparent",
          up ? "border-b-[26px] border-b-emerald-600" : "border-t-[26px] border-t-emerald-600",
        )}
      />
    </button>
  );
}

function LcdHousing({ device, rowsOverride }) {
  return (
    <div className="mx-auto w-[58%] rounded-[28px] border-[3px] border-emerald-200/80 px-[4.5%] py-[3.5%] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]">
      <div className="rounded-[16px] border-[6px] border-zinc-900 bg-zinc-800 p-[10px] shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
        <LcdCanvas device={device} scale={3.5} rowsOverride={rowsOverride} />
      </div>
    </div>
  );
}

export function InstrumentPanel({ device, onAction, labels, selectedFieldId, onSelectField, lcdRowsOverride = null }) {
  return (
    <div className="mx-auto w-full max-w-[1120px]">
      <div className="rounded-[36px] border border-emerald-700/40 bg-white p-4 shadow-sm">
        <div className="overflow-hidden rounded-[32px] border border-emerald-600/30 bg-[radial-gradient(circle_at_top,#10b86a_0%,#099654_60%,#087b45_100%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
          <div className="rounded-[28px] border-[3px] border-emerald-200/90 p-7 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.10)]">
            <div className="space-y-8">
              <div className="flex items-center justify-between gap-4">
                <TitlePlate
                  text={labels.titleLeft}
                  selected={selectedFieldId === "titleLeft"}
                  onSelect={() => onSelectField?.("titleLeft")}
                  widthClass="w-[38%]"
                />
                <TitlePlate
                  text={labels.titleRight}
                  selected={selectedFieldId === "titleRight"}
                  onSelect={() => onSelectField?.("titleRight")}
                  widthClass="w-[44%]"
                />
              </div>

              <LcdHousing device={device} rowsOverride={lcdRowsOverride} />

              <div className="mx-auto grid w-[84%] grid-cols-[repeat(3,minmax(0,1fr))_88px_1.2fr] gap-x-8 gap-y-5">
                {TOP_BUTTONS.map((item) => (
                  <PanelButton
                    key={item.id}
                    text={labels[item.id]}
                    selected={selectedFieldId === item.id}
                    onSelect={() => onSelectField?.(item.id)}
                    onClick={() => onAction(item.action)}
                    textClassName="min-h-[66px]"
                  />
                ))}

                <div className="row-span-4 grid grid-rows-[1fr_1fr_1fr] gap-4">
                  <ArrowButton direction="up" onClick={() => onAction("UP")} />
                  <ArrowButton direction="down" onClick={() => onAction("DOWN")} />
                  <PanelButton
                    text={labels.esc}
                    selected={selectedFieldId === "esc"}
                    onSelect={() => onSelectField?.("esc")}
                    onClick={() => onAction("ESC")}
                    textClassName="min-h-[82px]"
                  />
                </div>

                <div className="row-span-4 grid grid-rows-4 gap-4">
                  {SIDE_BUTTONS.map((item) => (
                    <PanelButton
                      key={item.id}
                      text={labels[item.id]}
                      subtext={item.subId ? labels[item.subId] : undefined}
                      selected={selectedFieldId === item.id || selectedFieldId === item.subId}
                      onSelect={() => onSelectField?.(item.subId ?? item.id)}
                      onClick={() => onAction(item.action)}
                      textClassName="min-h-[66px]"
                    />
                  ))}
                </div>

                {DIGIT_ROWS.flatMap((row, rowIndex) =>
                  row.map((item) => (
                    <PanelButton
                      key={`${rowIndex}-${item.id}`}
                      text={labels[item.id]}
                      subtext={item.subId ? labels[item.subId] : undefined}
                      shape="round"
                      selected={selectedFieldId === item.id || selectedFieldId === item.subId}
                      onSelect={() => onSelectField?.(item.subId ?? item.id)}
                      onClick={() => onAction(item.action)}
                    />
                  )),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
