import React, { useEffect, useMemo, useRef, useState } from "react";
import { LcdCanvas } from "./LcdCanvas.jsx";
import { SCREEN_INDEX } from "./ScenarioFlowMap.jsx";

const PANEL_MIN_W = 6;
const PANEL_MIN_H = 4;
const PANEL_MAX_W = 100;
const PANEL_MAX_H = 120;
const HANDLE_SIZE = 10;
const SNAP_THRESHOLD = 1.2;
export const PANEL_DRAG_THRESHOLD_PX = 4;
const ACTION_GOTO = "GOTOλ";

export const PANEL_LABEL_DEFAULTS = {
  titleLeft: "СПЕКТРОФОТОМЕТР",
  titleRight: "ЭКРОС-5400УФ",
  file: "ФАЙЛ",
  clear: "ОЧИСТИТЬ",
  print: "ПЕЧАТЬ",
  params: "ПАРАМЕТРЫ",
  goto: "ПЕРЕХОД λ",
  zero: "НОЛЬ",
  startMain: "START",
  startSub: "STOP",
  enter: "ВВОД",
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
  { id: "titleLeft", label: "Заголовок слева", group: "Заголовок" },
  { id: "titleRight", label: "Заголовок справа", group: "Заголовок" },
  { id: "file", label: "ФАЙЛ", group: "Основные кнопки" },
  { id: "clear", label: "ОЧИСТИТЬ", group: "Основные кнопки" },
  { id: "print", label: "ПЕЧАТЬ", group: "Основные кнопки" },
  { id: "params", label: "ПАРАМЕТРЫ", group: "Основные кнопки" },
  { id: "goto", label: "ПЕРЕХОД λ", group: "Правая колонка" },
  { id: "zero", label: "НОЛЬ", group: "Правая колонка" },
  { id: "startMain", label: "START", group: "Правая колонка" },
  { id: "startSub", label: "Подпись START", group: "Правая колонка" },
  { id: "enter", label: "ВВОД", group: "Правая колонка" },
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

const DEFAULT_ELEMENT_LAYOUT = {
  titlePlate: { x: 7, y: 4, w: 86, h: 10, hidden: false },
  screenBadge: { x: 8, y: 16.5, w: 30, h: 4.5, hidden: false },
  modeBadge: { x: 67, y: 16.5, w: 25, h: 4.5, hidden: false },
  lcdHousing: { x: 25, y: 22, w: 50, h: 24, hidden: false },
  file: { x: 12, y: 52, w: 12.5, h: 6.8, hidden: false },
  clear: { x: 28, y: 52, w: 12.5, h: 6.8, hidden: false },
  print: { x: 44, y: 52, w: 12.5, h: 6.8, hidden: false },
  params: { x: 60, y: 52, w: 14, h: 6.8, hidden: false },
  arrowUp: { x: 76.5, y: 51.5, w: 12.5, h: 12.5, hidden: false },
  goto: { x: 91, y: 52, w: 11, h: 8, hidden: false },
  digit1: { x: 12, y: 61.5, w: 12.5, h: 12.5, hidden: false },
  digit2: { x: 28, y: 61.5, w: 12.5, h: 12.5, hidden: false },
  digit3: { x: 44, y: 61.5, w: 12.5, h: 12.5, hidden: false },
  arrowDown: { x: 76.5, y: 66.5, w: 12.5, h: 12.5, hidden: false },
  zero: { x: 91, y: 62.5, w: 11, h: 8.5, hidden: false },
  digit4: { x: 12, y: 76.5, w: 12.5, h: 12.5, hidden: false },
  digit5: { x: 28, y: 76.5, w: 12.5, h: 12.5, hidden: false },
  digit6: { x: 44, y: 76.5, w: 12.5, h: 12.5, hidden: false },
  esc: { x: 76.5, y: 81.5, w: 12.5, h: 12.5, hidden: false },
  start: { x: 91, y: 74.5, w: 11, h: 8.5, hidden: false },
  digit7: { x: 12, y: 91.5, w: 12.5, h: 12.5, hidden: false },
  digit8: { x: 28, y: 91.5, w: 12.5, h: 12.5, hidden: false },
  digit9: { x: 44, y: 91.5, w: 12.5, h: 12.5, hidden: false },
  enter: { x: 91, y: 87.5, w: 11, h: 10, hidden: false },
  digit0: { x: 12, y: 106.5, w: 12.5, h: 12.5, hidden: false },
  digitDot: { x: 28, y: 106.5, w: 12.5, h: 12.5, hidden: false },
  digitMinus: { x: 44, y: 106.5, w: 12.5, h: 12.5, hidden: false },
};

export const DEFAULT_PANEL_ELEMENT_LAYOUT = DEFAULT_ELEMENT_LAYOUT;
const ELEMENT_ORDER = Object.keys(DEFAULT_ELEMENT_LAYOUT);
const HANDLE_DIRECTIONS = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function clampRange(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeFrame(frame, fallback) {
  const source = frame ?? fallback;
  const w = clampRange(Number(source.w ?? fallback.w), PANEL_MIN_W, PANEL_MAX_W);
  const h = clampRange(Number(source.h ?? fallback.h), PANEL_MIN_H, PANEL_MAX_H);
  const x = clampRange(Number(source.x ?? fallback.x), 0, PANEL_MAX_W - w);
  const y = clampRange(Number(source.y ?? fallback.y), 0, PANEL_MAX_H - h);
  return { x, y, w, h, hidden: Boolean(source.hidden) };
}

export function normalizePanelElementLayout(layout) {
  const source = layout && typeof layout === "object" ? layout : {};
  return Object.fromEntries(
    Object.entries(DEFAULT_ELEMENT_LAYOUT).map(([key, value]) => [key, normalizeFrame(source[key], value)]),
  );
}

export function getVisiblePanelElementIds(layout) {
  const normalized = normalizePanelElementLayout(layout);
  return ELEMENT_ORDER.filter((id) => !normalized[id].hidden);
}

export function getPanelSelectionBounds(layout, ids) {
  const normalized = normalizePanelElementLayout(layout);
  const selected = (ids ?? []).filter((id) => normalized[id] && !normalized[id].hidden);
  if (!selected.length) return null;
  const left = Math.min(...selected.map((id) => normalized[id].x));
  const top = Math.min(...selected.map((id) => normalized[id].y));
  const right = Math.max(...selected.map((id) => normalized[id].x + normalized[id].w));
  const bottom = Math.max(...selected.map((id) => normalized[id].y + normalized[id].h));
  return { x: left, y: top, w: right - left, h: bottom - top, ids: selected };
}

export function updatePanelSelectionGeometry(layout, ids, patch) {
  const normalized = normalizePanelElementLayout(layout);
  const bounds = getPanelSelectionBounds(normalized, ids);
  if (!bounds) return normalized;
  if (bounds.ids.length === 1) {
    const id = bounds.ids[0];
    return { ...normalized, [id]: normalizeFrame({ ...normalized[id], ...patch }, normalized[id]) };
  }
  const target = { x: patch.x ?? bounds.x, y: patch.y ?? bounds.y, w: patch.w ?? bounds.w, h: patch.h ?? bounds.h };
  const scaleX = bounds.w > 0 ? target.w / bounds.w : 1;
  const scaleY = bounds.h > 0 ? target.h / bounds.h : 1;
  const next = { ...normalized };
  bounds.ids.forEach((id) => {
    const frame = normalized[id];
    next[id] = normalizeFrame({
      x: target.x + (frame.x - bounds.x) * scaleX,
      y: target.y + (frame.y - bounds.y) * scaleY,
      w: frame.w * scaleX,
      h: frame.h * scaleY,
      hidden: frame.hidden,
    }, frame);
  });
  return next;
}

export function alignPanelSelection(layout, ids, alignment) {
  const normalized = normalizePanelElementLayout(layout);
  const bounds = getPanelSelectionBounds(normalized, ids);
  if (!bounds || bounds.ids.length < 2) return normalized;
  const next = { ...normalized };
  bounds.ids.forEach((id) => {
    const frame = normalized[id];
    const patch = {};
    if (alignment === "left") patch.x = bounds.x;
    if (alignment === "center") patch.x = bounds.x + (bounds.w - frame.w) / 2;
    if (alignment === "right") patch.x = bounds.x + bounds.w - frame.w;
    if (alignment === "top") patch.y = bounds.y;
    if (alignment === "middle") patch.y = bounds.y + (bounds.h - frame.h) / 2;
    if (alignment === "bottom") patch.y = bounds.y + bounds.h - frame.h;
    next[id] = normalizeFrame({ ...frame, ...patch }, frame);
  });
  return next;
}

export function hidePanelElements(layout, ids) {
  const normalized = normalizePanelElementLayout(layout);
  const next = { ...normalized };
  (ids ?? []).forEach((id) => {
    if (next[id]) next[id] = { ...next[id], hidden: true };
  });
  return next;
}

function getLabelFieldForElement(elementId, startIsStop) {
  const map = {
    titlePlate: "titleLeft",
    file: "file",
    clear: "clear",
    print: "print",
    params: "params",
    goto: "goto",
    zero: "zero",
    esc: "esc",
    start: startIsStop ? "startSub" : "startMain",
    enter: "enter",
    digit1: "digit1",
    digit2: "digit2Sub",
    digit3: "digit3Sub",
    digit4: "digit4Sub",
    digit5: "digit5Sub",
    digit6: "digit6Sub",
    digit7: "digit7Sub",
    digit8: "digit8Sub",
    digit9: "digit9Sub",
    digit0: "digit0",
    digitDot: "digitDot",
    digitMinus: "digitMinus",
  };
  return map[elementId] ?? null;
}

function getHandleStyle(direction) {
  const base = { position: "absolute", width: `${HANDLE_SIZE}px`, height: `${HANDLE_SIZE}px` };
  if (direction === "nw") return { ...base, left: `-${HANDLE_SIZE / 2}px`, top: `-${HANDLE_SIZE / 2}px` };
  if (direction === "n") return { ...base, left: "50%", top: `-${HANDLE_SIZE / 2}px`, transform: "translateX(-50%)" };
  if (direction === "ne") return { ...base, right: `-${HANDLE_SIZE / 2}px`, top: `-${HANDLE_SIZE / 2}px` };
  if (direction === "e") return { ...base, right: `-${HANDLE_SIZE / 2}px`, top: "50%", transform: "translateY(-50%)" };
  if (direction === "se") return { ...base, right: `-${HANDLE_SIZE / 2}px`, bottom: `-${HANDLE_SIZE / 2}px` };
  if (direction === "s") return { ...base, left: "50%", bottom: `-${HANDLE_SIZE / 2}px`, transform: "translateX(-50%)" };
  if (direction === "sw") return { ...base, left: `-${HANDLE_SIZE / 2}px`, bottom: `-${HANDLE_SIZE / 2}px` };
  if (direction === "w") return { ...base, left: `-${HANDLE_SIZE / 2}px`, top: "50%", transform: "translateY(-50%)" };
  return base;
}

function getHandleCursor(direction) {
  const map = { n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize", ne: "nesw-resize", sw: "nesw-resize", nw: "nwse-resize", se: "nwse-resize" };
  return map[direction] ?? "default";
}

function buildGuideCandidates(layout, excludedIds) {
  const normalized = normalizePanelElementLayout(layout);
  const excluded = new Set(excludedIds);
  const vertical = [{ value: 0, type: "edge" }, { value: 50, type: "center" }, { value: 100, type: "edge" }];
  const horizontal = [{ value: 0, type: "edge" }, { value: 60, type: "center" }, { value: 120, type: "edge" }];
  ELEMENT_ORDER.forEach((id) => {
    const frame = normalized[id];
    if (!frame || frame.hidden || excluded.has(id)) return;
    vertical.push({ value: frame.x, type: "edge" }, { value: frame.x + frame.w / 2, type: "center" }, { value: frame.x + frame.w, type: "edge" });
    horizontal.push({ value: frame.y, type: "edge" }, { value: frame.y + frame.h / 2, type: "center" }, { value: frame.y + frame.h, type: "edge" });
  });
  return { vertical, horizontal };
}

function getSnapAdjustment(lines, candidates) {
  let best = null;
  lines.forEach((line) => {
    candidates.forEach((candidate) => {
      if (line.type !== candidate.type) return;
      const offset = candidate.value - line.value;
      if (Math.abs(offset) > SNAP_THRESHOLD) return;
      if (!best || Math.abs(offset) < Math.abs(best.offset)) best = { offset, guide: candidate.value };
    });
  });
  return best;
}

function getBoundsLines(bounds) {
  return {
    vertical: [{ value: bounds.x, type: "edge" }, { value: bounds.x + bounds.w / 2, type: "center" }, { value: bounds.x + bounds.w, type: "edge" }],
    horizontal: [{ value: bounds.y, type: "edge" }, { value: bounds.y + bounds.h / 2, type: "center" }, { value: bounds.y + bounds.h, type: "edge" }],
  };
}

export function shiftFrames(layout, ids, deltaX, deltaY) {
  const normalized = normalizePanelElementLayout(layout);
  const next = { ...normalized };
  ids.forEach((id) => {
    next[id] = normalizeFrame({ ...normalized[id], x: normalized[id].x + deltaX, y: normalized[id].y + deltaY }, normalized[id]);
  });
  return next;
}

export function resizeSingleFrame(frame, handle, deltaX, deltaY) {
  let next = { ...frame };
  if (handle.includes("e")) next.w = clampRange(frame.w + deltaX, PANEL_MIN_W, PANEL_MAX_W - frame.x);
  if (handle.includes("s")) next.h = clampRange(frame.h + deltaY, PANEL_MIN_H, PANEL_MAX_H - frame.y);
  if (handle.includes("w")) {
    const width = clampRange(frame.w - deltaX, PANEL_MIN_W, frame.x + frame.w);
    next.x = clampRange(frame.x + (frame.w - width), 0, PANEL_MAX_W - PANEL_MIN_W);
    next.w = clampRange(width, PANEL_MIN_W, PANEL_MAX_W - next.x);
  }
  if (handle.includes("n")) {
    const height = clampRange(frame.h - deltaY, PANEL_MIN_H, frame.y + frame.h);
    next.y = clampRange(frame.y + (frame.h - height), 0, PANEL_MAX_H - PANEL_MIN_H);
    next.h = clampRange(height, PANEL_MIN_H, PANEL_MAX_H - next.y);
  }
  return normalizeFrame(next, frame);
}

export function hasPanelDragThresholdPassed(startX, startY, currentX, currentY, threshold = PANEL_DRAG_THRESHOLD_PX) {
  return Math.hypot(currentX - startX, currentY - startY) >= threshold;
}

export function togglePanelSelectionIds(selection, id) {
  return selection.includes(id)
    ? selection.filter((item) => item !== id)
    : [...selection, id];
}

export function resizeSelectionBounds(bounds, handle, deltaX, deltaY) {
  return resizeSingleFrame(bounds, handle, deltaX, deltaY);
}

export function movePanelSelectionFromOrigin(originLayout, ids, deltaX, deltaY) {
  return shiftFrames(originLayout, ids, deltaX, deltaY);
}

export function resizePanelSelectionFromOrigin(originLayout, ids, originBounds, handle, deltaX, deltaY) {
  const nextBounds = resizeSelectionBounds(originBounds, handle, deltaX, deltaY);
  return updatePanelSelectionGeometry(originLayout, ids, nextBounds);
}

function frameIntersects(a, b) {
  return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
}

function TitlePlate({ leftText, rightText, canvasMode, selected }) {
  return (
    <div className={cx("flex h-full w-full items-center justify-between rounded-[16px] border border-emerald-200/80 px-[4.8%] py-[3.2%] text-left text-white transition", "bg-emerald-500/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]", selected && !canvasMode && "ring-2 ring-white/80 ring-offset-2 ring-offset-emerald-700")}>
      <span className="block max-w-[48%] truncate text-[clamp(14px,1.4vw,23px)] font-semibold tracking-[0.03em]">{leftText}</span>
      <span className="block max-w-[48%] truncate text-[clamp(14px,1.4vw,23px)] font-semibold tracking-[0.03em] text-right">{rightText}</span>
    </div>
  );
}

function PanelButton({ text, subtext, shape = "rect", tone = "default", selected, canvasMode }) {
  const toneClass = { default: "bg-stone-100 text-emerald-700 border-stone-300/90", warning: "bg-amber-50 text-amber-800 border-amber-200", neutral: "bg-zinc-100 text-zinc-700 border-zinc-300", action: "bg-emerald-50 text-emerald-700 border-emerald-200", danger: "bg-rose-50 text-rose-700 border-rose-200" }[tone];
  return (
    <div className={cx("group relative flex h-full w-full items-center justify-center overflow-hidden border shadow-[3px_4px_0_rgba(0,0,0,0.10)] transition duration-150", !canvasMode && "hover:-translate-y-[1px]", shape === "round" ? "rounded-full" : "rounded-[14px]", toneClass, selected && !canvasMode && "ring-2 ring-amber-300 ring-offset-2 ring-offset-emerald-700")}>
      <div className="pointer-events-none absolute inset-x-[8%] top-[8%] h-[28%] rounded-full bg-white/55 blur-sm" />
      <span className="relative z-10 flex flex-col items-center justify-center px-2 text-center leading-tight">
        <span className="font-semibold text-[clamp(11px,1.05vw,18px)]">{text}</span>
        {subtext ? <span className="text-[clamp(7px,0.6vw,10px)] font-medium uppercase tracking-[0.08em] opacity-80">{subtext}</span> : null}
      </span>
    </div>
  );
}

function ArrowButton({ direction, canvasMode = false }) {
  return <div className={cx("group relative flex h-full w-full items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-emerald-700 shadow-[3px_4px_0_rgba(0,0,0,0.10)] transition duration-150", !canvasMode && "hover:-translate-y-[1px]")}><div className="absolute inset-x-[10%] top-[10%] h-[28%] rounded-full bg-white/55 blur-sm" /><span className="relative z-10 text-[clamp(30px,3vw,44px)] leading-none">{direction === "up" ? "▲" : "▼"}</span></div>;
}

function StatusBadge({ children }) {
  return <div className="flex h-full w-full items-center rounded-full bg-emerald-950/20 px-3 py-1 text-[clamp(11px,0.85vw,14px)] font-medium text-white"><span className="truncate">{children}</span></div>;
}

function LcdHousing({ device, rowsOverride, lcdScale, scaleMultiplier }) {
  return <div className="flex h-full w-full items-center justify-center rounded-[28px] border-[3px] border-emerald-200/80 px-[7%] py-[7%] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"><div className="rounded-[14px] border-[6px] border-zinc-900 bg-zinc-800 p-[10px] shadow-[0_8px_18px_rgba(0,0,0,0.18)]"><LcdCanvas device={device} scale={lcdScale * scaleMultiplier} rowsOverride={rowsOverride} /></div></div>;
}

function SelectionOutline({ id, frame, canvasMode, selected, children, onMouseDown }) {
  return (
    <div
      className={cx("absolute overflow-visible", canvasMode && "cursor-move")}
      style={{ left: `${frame.x}%`, top: `${(frame.y / PANEL_MAX_H) * 100}%`, width: `${frame.w}%`, height: `${(frame.h / PANEL_MAX_H) * 100}%` }}
      onMouseDown={onMouseDown}
      data-panel-element-id={id}
    >
      <div className={cx("relative h-full w-full", canvasMode && selected && "rounded-[18px] ring-2 ring-amber-300 ring-offset-2 ring-offset-emerald-700/70")}>
        <div className={canvasMode ? "pointer-events-none h-full w-full" : "h-full w-full"}>{children}</div>
      </div>
    </div>
  );
}

function SelectionBoundsOverlay({ bounds, onResizeStart }) {
  if (!bounds) return null;
  return (
    <div
      className="pointer-events-none absolute overflow-visible"
      style={{ left: `${bounds.x}%`, top: `${(bounds.y / PANEL_MAX_H) * 100}%`, width: `${bounds.w}%`, height: `${(bounds.h / PANEL_MAX_H) * 100}%` }}
      data-panel-selection-bounds="true"
    >
      <div className="pointer-events-none relative h-full w-full rounded-[18px] ring-2 ring-sky-300 ring-offset-2 ring-offset-emerald-700/70" />
      {HANDLE_DIRECTIONS.map((direction) => (
        <button
          key={direction}
          type="button"
          aria-label={`Resize selection ${direction}`}
          className="pointer-events-auto absolute rounded-full border-2 border-white bg-amber-400 shadow"
          style={{ ...getHandleStyle(direction), cursor: getHandleCursor(direction) }}
          onMouseDown={(event) => onResizeStart(event, direction)}
        />
      ))}
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
  panelLayoutConfig = null,
  panelElementLayout = null,
  selectedElementIds = [],
  onSelectedElementIdsChange = null,
  onPanelElementLayoutChange = null,
  onDeleteSelectedElements = null,
  mode = "simulation",
}) {
  const stageRef = useRef(null);
  const elementsRef = useRef(null);
  const selectionRef = useRef(selectedElementIds);
  const selectionBoxRef = useRef(null);
  const [interaction, setInteraction] = useState(null);
  const [guides, setGuides] = useState([]);
  const [selectionBox, setSelectionBox] = useState(null);
  const isCanvasMode = mode === "canvas" || mode === "edit";
  const layout = panelLayoutConfig ?? { lcdScale: 3.5 };
  const elements = useMemo(() => normalizePanelElementLayout(panelElementLayout), [panelElementLayout]);
  const visibleIds = useMemo(() => getVisiblePanelElementIds(elements), [elements]);
  const startIsStop = device.screen === "kineticsRun";
  const selection = useMemo(() => selectedElementIds.filter((id) => visibleIds.includes(id)), [selectedElementIds, visibleIds]);
  const selectionBounds = useMemo(() => getPanelSelectionBounds(elements, selection), [elements, selection]);

  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  useEffect(() => {
    selectionBoxRef.current = selectionBox;
  }, [selectionBox]);

  useEffect(() => {
    if (!isCanvasMode || !onDeleteSelectedElements) return undefined;
    const onKeyDown = (event) => {
      const tag = event.target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        onDeleteSelectedElements(selection);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isCanvasMode, onDeleteSelectedElements, selection]);

  useEffect(() => {
    if (!isCanvasMode || !interaction) return undefined;
    const stop = () => {
      const currentElements = elementsRef.current ?? elements;
      const currentSelection = selectionRef.current ?? selection;
      const currentSelectionBox = selectionBoxRef.current ?? selectionBox;
      if (interaction.type === "marquee" && currentSelectionBox) {
        const found = getVisiblePanelElementIds(currentElements).filter((id) => frameIntersects(currentElements[id], currentSelectionBox));
        onSelectedElementIdsChange?.(interaction.additive ? Array.from(new Set([...currentSelection, ...found])) : found);
      }
      setInteraction(null);
      setGuides([]);
      setSelectionBox(null);
    };

    const onMove = (event) => {
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return;
      let nextInteraction = interaction;

      if (interaction.type === "stage-press") {
        if (!hasPanelDragThresholdPassed(interaction.startX, interaction.startY, event.clientX, event.clientY)) return;
        nextInteraction = {
          type: "marquee",
          additive: interaction.additive,
          origin: interaction.origin,
        };
        setInteraction(nextInteraction);
      }

      if (interaction.type === "element-press") {
        if (!hasPanelDragThresholdPassed(interaction.startX, interaction.startY, event.clientX, event.clientY)) return;
        nextInteraction = {
          type: "drag",
          ids: interaction.ids,
          startX: interaction.startX,
          startY: interaction.startY,
          originLayout: interaction.originLayout,
        };
        setInteraction(nextInteraction);
      }

      if (nextInteraction.type === "marquee") {
        const currentX = ((event.clientX - rect.left) / rect.width) * 100;
        const currentY = ((event.clientY - rect.top) / rect.height) * PANEL_MAX_H;
        setSelectionBox({
          x: Math.min(nextInteraction.origin.x, currentX),
          y: Math.min(nextInteraction.origin.y, currentY),
          w: Math.abs(currentX - nextInteraction.origin.x),
          h: Math.abs(currentY - nextInteraction.origin.y),
        });
        return;
      }

      const deltaX = ((event.clientX - nextInteraction.startX) / rect.width) * 100;
      const deltaY = ((event.clientY - nextInteraction.startY) / rect.height) * PANEL_MAX_H;

      onPanelElementLayoutChange?.((current) => {
        const normalized = normalizePanelElementLayout(current);
        const candidates = buildGuideCandidates(normalized, nextInteraction.ids);

        if (nextInteraction.type === "drag") {
          const moved = movePanelSelectionFromOrigin(nextInteraction.originLayout, nextInteraction.ids, deltaX, deltaY);
          const bounds = getPanelSelectionBounds(moved, nextInteraction.ids);
          if (!bounds) return normalized;
          const lines = getBoundsLines(bounds);
          const snapX = getSnapAdjustment(lines.vertical, candidates.vertical);
          const snapY = getSnapAdjustment(lines.horizontal, candidates.horizontal);
          setGuides([...(snapX ? [{ orientation: "v", value: snapX.guide }] : []), ...(snapY ? [{ orientation: "h", value: snapY.guide }] : [])]);
          return movePanelSelectionFromOrigin(nextInteraction.originLayout, nextInteraction.ids, deltaX + (snapX?.offset ?? 0), deltaY + (snapY?.offset ?? 0));
        }

        let bounds = resizeSelectionBounds(nextInteraction.originBounds, nextInteraction.handle, deltaX, deltaY);
        const lineDefs = [];
        if (nextInteraction.handle.includes("w")) lineDefs.push({ axis: "x", value: bounds.x, patch: (candidate) => ({ x: candidate, w: bounds.w + (bounds.x - candidate) }) });
        if (nextInteraction.handle.includes("e")) lineDefs.push({ axis: "x", value: bounds.x + bounds.w, patch: (candidate) => ({ w: candidate - bounds.x }) });
        if (nextInteraction.handle.includes("n")) lineDefs.push({ axis: "y", value: bounds.y, patch: (candidate) => ({ y: candidate, h: bounds.h + (bounds.y - candidate) }) });
        if (nextInteraction.handle.includes("s")) lineDefs.push({ axis: "y", value: bounds.y + bounds.h, patch: (candidate) => ({ h: candidate - bounds.y }) });
        const nextGuides = [];
        lineDefs.forEach((line) => {
          const snap = getSnapAdjustment([{ value: line.value, type: "edge" }], line.axis === "x" ? candidates.vertical : candidates.horizontal);
          if (snap) {
            bounds = normalizeFrame({ ...bounds, ...line.patch(snap.guide) }, bounds);
            nextGuides.push({ orientation: line.axis === "x" ? "v" : "h", value: snap.guide });
          }
        });
        setGuides(nextGuides);
        return updatePanelSelectionGeometry(nextInteraction.originLayout, nextInteraction.ids, bounds);
      });
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", stop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", stop);
    };
  }, [elements, interaction, isCanvasMode, onPanelElementLayoutChange, onSelectedElementIdsChange, selection, selectionBox]);

  const beginElementPress = (event, id) => {
    if (!isCanvasMode) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.shiftKey) {
      onSelectedElementIdsChange?.(togglePanelSelectionIds(selection, id));
      setInteraction(null);
      setGuides([]);
      setSelectionBox(null);
      return;
    }
    const ids = selection.includes(id) ? selection : [id];
    if (!selection.includes(id)) onSelectedElementIdsChange?.(ids);
    setInteraction({
      type: "element-press",
      ids,
      startX: event.clientX,
      startY: event.clientY,
      originLayout: elements,
    });
  };

  const beginResize = (event, handle) => {
    if (!isCanvasMode) return;
    event.preventDefault();
    event.stopPropagation();
    if (!selectionBounds?.ids.length) return;
    setInteraction({
      type: "resize",
      ids: selectionBounds.ids,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      originLayout: elements,
      originBounds: selectionBounds,
    });
  };

  const beginStagePress = (event) => {
    if (!isCanvasMode || event.target !== event.currentTarget) return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * PANEL_MAX_H;
    if (!event.shiftKey) onSelectedElementIdsChange?.([]);
    setSelectionBox(null);
    setGuides([]);
    setInteraction({ type: "stage-press", additive: event.shiftKey, startX: event.clientX, startY: event.clientY, origin: { x, y } });
  };

  const scaleMultiplier = useMemo(() => {
    const frame = elements.lcdHousing;
    const base = DEFAULT_ELEMENT_LAYOUT.lcdHousing;
    return Math.max(0.7, Math.min(1.8, Math.min(frame.w / base.w, frame.h / base.h)));
  }, [elements]);

  const renderElement = (id) => {
    if (id === "titlePlate") return <TitlePlate leftText={labels.titleLeft} rightText={labels.titleRight} canvasMode={isCanvasMode} selected={selection.includes(id)} />;
    if (id === "screenBadge") return <StatusBadge>{SCREEN_INDEX[device.screen] ?? "WND-??"} / {device.screen}</StatusBadge>;
    if (id === "modeBadge") return <StatusBadge>Режим: {isCanvasMode ? "холст" : "симуляция"}</StatusBadge>;
    if (id === "lcdHousing") return <LcdHousing device={device} rowsOverride={lcdRowsOverride} lcdScale={layout.lcdScale ?? 3.5} scaleMultiplier={scaleMultiplier} />;
    if (id === "arrowUp") return <ArrowButton direction="up" canvasMode={isCanvasMode} />;
    if (id === "arrowDown") return <ArrowButton direction="down" canvasMode={isCanvasMode} />;
    if (id === "goto") return <PanelButton text={labels.goto} tone="action" selected={selectedFieldId === "goto"} canvasMode={isCanvasMode} />;
    if (id === "zero") return <PanelButton text={labels.zero} tone="warning" selected={selectedFieldId === "zero"} canvasMode={isCanvasMode} />;
    if (id === "esc") return <PanelButton text={labels.esc} tone="neutral" selected={selectedFieldId === "esc"} canvasMode={isCanvasMode} />;
    if (id === "start") return <PanelButton text={startIsStop ? labels.startSub : labels.startMain} tone={startIsStop ? "danger" : "action"} selected={selectedFieldId === "startMain" || selectedFieldId === "startSub"} canvasMode={isCanvasMode} />;
    if (id === "enter") return <PanelButton text={labels.enter} tone="action" selected={selectedFieldId === "enter"} canvasMode={isCanvasMode} />;
    const subMap = { digit2: labels.digit2Sub, digit3: labels.digit3Sub, digit4: labels.digit4Sub, digit5: labels.digit5Sub, digit6: labels.digit6Sub, digit7: labels.digit7Sub, digit8: labels.digit8Sub, digit9: labels.digit9Sub };
    return <PanelButton text={labels[id]} subtext={subMap[id]} shape={id.startsWith("digit") ? "round" : "rect"} selected={selectedFieldId === id || selectedFieldId === `${id}Sub`} canvasMode={isCanvasMode} />;
  };

  const handleSimulationClick = (id) => {
    if (isCanvasMode) return;
    const fieldId = getLabelFieldForElement(id, startIsStop);
    if (fieldId) onSelectField?.(fieldId);
    const actionMap = { file: "FILE", clear: "CLEAR", print: "PRINT", params: "SET", goto: ACTION_GOTO, zero: "ZERO", arrowUp: "UP", arrowDown: "DOWN", esc: "ESC", start: "START/STOP", enter: "ENTER", digit1: "1", digit2: "2", digit3: "3", digit4: "4", digit5: "5", digit6: "6", digit7: "7", digit8: "8", digit9: "9", digit0: "0", digitDot: ".", digitMinus: "-" };
    if (actionMap[id]) onAction(actionMap[id]);
  };

  return (
    <div className="mx-auto w-full max-w-[1120px]" data-canvas-block-content="true">
      <div className="rounded-[36px] border border-emerald-700/40 bg-white p-4 shadow-sm">
        <div className="overflow-hidden rounded-[32px] border border-emerald-600/30 bg-[radial-gradient(circle_at_top,#10b86a_0%,#099654_60%,#087b45_100%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
          <div className="rounded-[28px] border-[3px] border-emerald-200/90 p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.10)]">
            <div ref={stageRef} className={cx("relative w-full rounded-[24px]", isCanvasMode && "bg-white/5")} style={{ aspectRatio: "5 / 6" }} onMouseDown={beginStagePress} data-panel-stage="true">
              {guides.map((guide, index) => <div key={`${guide.orientation}-${guide.value}-${index}`} className="pointer-events-none absolute bg-sky-300/90" style={guide.orientation === "v" ? { left: `${guide.value}%`, top: 0, width: "2px", height: "100%" } : { top: `${(guide.value / PANEL_MAX_H) * 100}%`, left: 0, height: "2px", width: "100%" }} />)}
              {selectionBox ? <div className="pointer-events-none absolute border border-sky-400 bg-sky-300/15" style={{ left: `${selectionBox.x}%`, top: `${(selectionBox.y / PANEL_MAX_H) * 100}%`, width: `${selectionBox.w}%`, height: `${(selectionBox.h / PANEL_MAX_H) * 100}%` }} /> : null}
              {visibleIds.map((id) => (
                <SelectionOutline key={id} id={id} frame={elements[id]} canvasMode={isCanvasMode} selected={selection.includes(id)} onMouseDown={(event) => (isCanvasMode ? beginElementPress(event, id) : handleSimulationClick(id))}>
                  {renderElement(id)}
                </SelectionOutline>
              ))}
              {isCanvasMode && selectionBounds ? <SelectionBoundsOverlay bounds={selectionBounds} onResizeStart={beginResize} /> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
