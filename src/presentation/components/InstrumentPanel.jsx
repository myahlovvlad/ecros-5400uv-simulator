import React from "react";
import { LcdCanvas } from "./LcdCanvas.jsx";

export const PANEL_LABEL_DEFAULTS = {
  titleCenter: "Спектрофотометр ЭКРОС-5400УФ",
  file: "Файл",
  clear: "Очистить",
  print: "Печать",
  params: "Параметры",
  goto: "Переход λ",
  zero: "Ноль",
  startMain: "START",
  startSub: "stop",
  enter: "Ввод",
  esc: "ESC",
  digit1: "1",
  digit2: "2",
  digit2Sub: "ABC",
  digit3: "3",
  digit3Sub: "DEF",
  digit4: "4",
  digit4Sub: "GHI",
  digit5: "5",
  digit5Sub: "JKL",
  digit6: "6",
  digit6Sub: "MNO",
  digit7: "7",
  digit7Sub: "PQRS",
  digit8: "8",
  digit8Sub: "TUV",
  digit9: "9",
  digit9Sub: "WXYZ",
  digit0: "0",
  digitDot: ".",
  digitMinus: "-",
};

export const PANEL_LABEL_FIELDS = [
  { id: "titleCenter", label: "Центральный заголовок", group: "Заголовок" },
  { id: "file", label: "Файл", group: "Основные кнопки" },
  { id: "clear", label: "Очистить", group: "Основные кнопки" },
  { id: "print", label: "Печать", group: "Основные кнопки" },
  { id: "params", label: "Параметры", group: "Основные кнопки" },
  { id: "goto", label: "Переход λ", group: "Правая колонка" },
  { id: "zero", label: "Ноль", group: "Правая колонка" },
  { id: "startMain", label: "START", group: "Правая колонка" },
  { id: "startSub", label: "Подпись START", group: "Правая колонка" },
  { id: "enter", label: "Ввод", group: "Правая колонка" },
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
  { id: "goto", action: "GOTOО»" },
  { id: "zero", action: "ZERO" },
  { id: "startMain", action: "START/STOP", subId: "startSub" },
  { id: "enter", action: "ENTER" },
];

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function TitlePlate({ text, selected, onSelect }) {
  return (
    <button
      type="button"
      data-testid="panel-title-center"
      aria-label={text}
      onClick={onSelect}
      className={cx(
        "mx-auto flex w-full max-w-[34rem] items-center justify-center rounded-[18px] px-5 py-3 text-center text-white transition",
        "bg-emerald-500/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]",
        selected && "ring-2 ring-white/80 ring-offset-2 ring-offset-emerald-700",
      )}
    >
      <span className="block truncate text-[clamp(0.95rem,1.5vw,1.5rem)] font-semibold tracking-[0.05em]">{text}</span>
    </button>
  );
}

function PanelButton({ text, subtext, shape = "rect", selected, onClick, onSelect, textClassName = "", testId }) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-label={subtext ? `${text} ${subtext}` : text}
      onClick={(event) => {
        onSelect?.();
        onClick?.(event);
      }}
      className={cx(
        "group relative flex items-center justify-center overflow-hidden border border-stone-300/90 bg-stone-100 text-emerald-700",
        "shadow-[4px_5px_0_rgba(0,0,0,0.12)] transition duration-150 hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_3px_0_rgba(0,0,0,0.12)]",
        shape === "round" ? "mx-auto aspect-square w-full max-w-[5.2rem] rounded-full" : "min-h-[3.8rem] rounded-2xl",
        selected && "ring-2 ring-amber-300 ring-offset-2 ring-offset-emerald-700",
      )}
    >
      <div className="pointer-events-none absolute inset-x-[10%] top-[10%] h-[24%] rounded-full bg-white/55 blur-sm" />
      <span className={cx("relative z-10 flex flex-col items-center justify-center px-2 text-center leading-tight", textClassName)}>
        <span className="text-[clamp(0.85rem,1vw,1.15rem)] font-medium">{text}</span>
        {subtext ? <span className="text-[clamp(0.5rem,0.7vw,0.72rem)] font-medium tracking-wide opacity-80">{subtext}</span> : null}
      </span>
    </button>
  );
}

function ArrowButton({ direction, onClick }) {
  const up = direction === "up";

  return (
    <button
      type="button"
      data-testid={`panel-arrow-${direction}`}
      aria-label={up ? "Вверх" : "Вниз"}
      onClick={onClick}
      className="group relative mx-auto aspect-square w-full max-w-[3.8rem] rounded-full border border-stone-300/90 bg-stone-100 text-emerald-700 shadow-[4px_5px_0_rgba(0,0,0,0.12)] transition duration-150 hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_3px_0_rgba(0,0,0,0.12)]"
    >
      <div className="absolute inset-x-[14%] top-[12%] h-[24%] rounded-full bg-white/55 blur-sm" />
      <div
        className={cx(
          "absolute left-1/2 top-1/2 h-0 w-0 -translate-x-1/2 -translate-y-1/2 border-x-[12px] border-x-transparent",
          up ? "border-b-[20px] border-b-emerald-600" : "border-t-[20px] border-t-emerald-600",
        )}
      />
    </button>
  );
}

function LcdHousing({
  device,
  rowsOverride,
  lcdEditorEnabled,
  selectedLcdRowIndex,
  onSelectLcdRow,
  onMoveLcdRow,
  onCanvasReady,
  titleUnderline,
  glyphOverrides,
}) {
  return (
    <div className="mx-auto w-full max-w-[32rem] rounded-[24px] border-[2px] border-emerald-200/80 px-[4.5%] py-[3.5%] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]">
      <div className="rounded-[14px] border-[5px] border-zinc-900 bg-zinc-800 p-[10px] shadow-[0_8px_18px_rgba(0,0,0,0.18)]">
        <LcdCanvas
          device={device}
          scale={3.1}
          rowsOverride={rowsOverride}
          editorEnabled={lcdEditorEnabled}
          selectedRowIndex={selectedLcdRowIndex}
          onSelectRow={onSelectLcdRow}
          onMoveRow={onMoveLcdRow}
          onCanvasReady={onCanvasReady}
          titleUnderline={titleUnderline}
          glyphOverrides={glyphOverrides}
        />
      </div>
    </div>
  );
}

export function InstrumentPanel({
  device,
  onAction,
  labels,
  selectedFieldId,
  onSelectField,
  lcdRowsOverride = null,
  lcdEditorEnabled = false,
  selectedLcdRowIndex = 0,
  onSelectLcdRow,
  onMoveLcdRow,
  onCanvasReady,
  titleUnderline = false,
  glyphOverrides = null,
}) {
  return (
    <div data-testid="instrument-panel" className="mx-auto w-full max-w-[980px]">
      <div className="rounded-[32px] border border-emerald-700/40 bg-white p-3 shadow-sm sm:p-4">
        <div className="overflow-hidden rounded-[28px] border border-emerald-600/30 bg-[radial-gradient(circle_at_top,#10b86a_0%,#099654_60%,#087b45_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] sm:p-5">
          <div className="rounded-[24px] border-[2px] border-emerald-200/90 p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.10)] sm:p-6">
            <div className="space-y-5 sm:space-y-6">
              <TitlePlate
                text={labels.titleCenter}
                selected={selectedFieldId === "titleCenter"}
                onSelect={() => onSelectField?.("titleCenter")}
              />

              <LcdHousing
                device={device}
                rowsOverride={lcdRowsOverride}
                lcdEditorEnabled={lcdEditorEnabled}
                selectedLcdRowIndex={selectedLcdRowIndex}
                onSelectLcdRow={onSelectLcdRow}
                onMoveLcdRow={onMoveLcdRow}
                onCanvasReady={onCanvasReady}
                titleUnderline={titleUnderline}
                glyphOverrides={glyphOverrides}
              />

              <div className="mx-auto w-full max-w-[48rem] space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {TOP_BUTTONS.map((item) => (
                    <PanelButton
                      key={item.id}
                      testId={`panel-button-${item.id}`}
                      text={labels[item.id]}
                      selected={selectedFieldId === item.id}
                      onSelect={() => onSelectField?.(item.id)}
                      onClick={() => onAction(item.action)}
                    />
                  ))}
                </div>

                <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_4.5rem_minmax(10rem,12rem)]">
                  <div className="grid grid-cols-3 gap-3">
                    {DIGIT_ROWS.flatMap((row, rowIndex) =>
                      row.map((item) => (
                        <PanelButton
                          key={`${rowIndex}-${item.id}`}
                          testId={`panel-button-${item.id}`}
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

                  <div className="grid grid-cols-3 gap-3 xl:grid-cols-1 xl:grid-rows-[1fr_1fr_1fr]">
                    <ArrowButton direction="up" onClick={() => onAction("UP")} />
                    <ArrowButton direction="down" onClick={() => onAction("DOWN")} />
                    <PanelButton
                      testId="panel-button-esc"
                      text={labels.esc}
                      selected={selectedFieldId === "esc"}
                      onSelect={() => onSelectField?.("esc")}
                      onClick={() => onAction("ESC")}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    {SIDE_BUTTONS.map((item) => (
                      <PanelButton
                        key={item.id}
                        testId={`panel-button-${item.id}`}
                        text={labels[item.id]}
                        subtext={item.subId ? labels[item.subId] : undefined}
                        selected={selectedFieldId === item.id || selectedFieldId === item.subId}
                        onSelect={() => onSelectField?.(item.subId ?? item.id)}
                        onClick={() => onAction(item.action)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
