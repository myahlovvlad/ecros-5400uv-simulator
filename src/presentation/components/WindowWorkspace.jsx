import React, { useEffect, useMemo, useRef, useState } from "react";

const WINDOW_MIN_W = 260;
const WINDOW_MIN_H = 180;
const WINDOW_HEADER_H = 46;
const HANDLE_SIZE = 12;

function clamp(value, min, max = Number.POSITIVE_INFINITY) {
  return Math.max(min, Math.min(max, value));
}

function computeWorkspaceHeight(windows) {
  const maxBottom = windows.reduce((acc, item) => {
    const height = item.collapsed ? WINDOW_HEADER_H : item.h;
    return Math.max(acc, item.y + height);
  }, 980);
  return maxBottom + 120;
}

function computeWorkspaceWidth(windows) {
  const maxRight = windows.reduce((acc, item) => Math.max(acc, item.x + item.w), 1320);
  return maxRight + 120;
}

function normalizeMode(mode) {
  return mode === "edit" ? "canvas" : mode;
}

function getResizeCursor(handle) {
  const map = {
    n: "ns-resize",
    s: "ns-resize",
    e: "ew-resize",
    w: "ew-resize",
    ne: "nesw-resize",
    sw: "nesw-resize",
    nw: "nwse-resize",
    se: "nwse-resize",
  };
  return map[handle] ?? "default";
}

function buildHandleStyle(handle) {
  const base = {
    position: "absolute",
    width: `${HANDLE_SIZE}px`,
    height: `${HANDLE_SIZE}px`,
  };

  switch (handle) {
    case "nw":
      return { ...base, left: `-${HANDLE_SIZE / 2}px`, top: `-${HANDLE_SIZE / 2}px` };
    case "n":
      return { ...base, left: "50%", top: `-${HANDLE_SIZE / 2}px`, transform: "translateX(-50%)" };
    case "ne":
      return { ...base, right: `-${HANDLE_SIZE / 2}px`, top: `-${HANDLE_SIZE / 2}px` };
    case "e":
      return { ...base, right: `-${HANDLE_SIZE / 2}px`, top: "50%", transform: "translateY(-50%)" };
    case "se":
      return { ...base, right: `-${HANDLE_SIZE / 2}px`, bottom: `-${HANDLE_SIZE / 2}px` };
    case "s":
      return { ...base, left: "50%", bottom: `-${HANDLE_SIZE / 2}px`, transform: "translateX(-50%)" };
    case "sw":
      return { ...base, left: `-${HANDLE_SIZE / 2}px`, bottom: `-${HANDLE_SIZE / 2}px` };
    case "w":
      return { ...base, left: `-${HANDLE_SIZE / 2}px`, top: "50%", transform: "translateY(-50%)" };
    default:
      return base;
  }
}

export function normalizeWindowLayout(layout, defaults) {
  const saved = new Map((Array.isArray(layout) ? layout : []).map((item) => [item.id, item]));

  return defaults.map((item, index) => ({
    ...item,
    ...(saved.get(item.id) ?? {}),
    z: typeof saved.get(item.id)?.z === "number" ? saved.get(item.id).z : index + 1,
    collapsed: Boolean(saved.get(item.id)?.collapsed),
  }));
}

export function WindowWorkspace({
  mode,
  windows,
  setWindows,
  renderWindow,
}) {
  const workspaceRef = useRef(null);
  const normalizedMode = normalizeMode(mode);
  const isCanvasMode = normalizedMode === "canvas";
  const [interaction, setInteraction] = useState(null);
  const [selectedId, setSelectedId] = useState(() => windows[0]?.id ?? null);

  const workspaceHeight = useMemo(() => computeWorkspaceHeight(windows), [windows]);
  const workspaceWidth = useMemo(() => computeWorkspaceWidth(windows), [windows]);
  const maxZ = useMemo(() => windows.reduce((acc, item) => Math.max(acc, item.z ?? 0), 0), [windows]);

  useEffect(() => {
    if (!windows.some((item) => item.id === selectedId)) {
      setSelectedId(windows[0]?.id ?? null);
    }
  }, [selectedId, windows]);

  useEffect(() => {
    if (!interaction) return undefined;

    const onMove = (event) => {
      event.preventDefault();
      const deltaX = event.clientX - interaction.startX;
      const deltaY = event.clientY - interaction.startY;

      setWindows((current) => current.map((item) => {
        if (item.id !== interaction.id) return item;

        if (interaction.type === "drag") {
          return {
            ...item,
            x: clamp(interaction.originX + deltaX, 0),
            y: clamp(interaction.originY + deltaY, 0),
          };
        }

        let nextX = interaction.originX;
        let nextY = interaction.originY;
        let nextW = interaction.originW;
        let nextH = interaction.originH;

        if (interaction.handle.includes("e")) {
          nextW = clamp(interaction.originW + deltaX, WINDOW_MIN_W);
        }
        if (interaction.handle.includes("s")) {
          nextH = clamp(interaction.originH + deltaY, WINDOW_MIN_H);
        }
        if (interaction.handle.includes("w")) {
          nextW = clamp(interaction.originW - deltaX, WINDOW_MIN_W);
          nextX = interaction.originX + (interaction.originW - nextW);
        }
        if (interaction.handle.includes("n")) {
          nextH = clamp(interaction.originH - deltaY, WINDOW_MIN_H);
          nextY = interaction.originY + (interaction.originH - nextH);
        }

        return {
          ...item,
          x: clamp(nextX, 0),
          y: clamp(nextY, 0),
          w: nextW,
          h: nextH,
        };
      }));
    };

    const stop = () => setInteraction(null);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", stop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", stop);
    };
  }, [interaction, setWindows]);

  const focusWindow = (id) => {
    setSelectedId(id);
    setWindows((current) => current.map((item) => (
      item.id === id ? { ...item, z: maxZ + 1 } : item
    )));
  };

  const toggleCollapse = (id) => {
    focusWindow(id);
    setWindows((current) => current.map((item) => (
      item.id === id ? { ...item, collapsed: !item.collapsed, z: maxZ + 1 } : item
    )));
  };

  const startDrag = (event, item) => {
    if (!isCanvasMode) return;
    event.preventDefault();
    focusWindow(item.id);
    setInteraction({
      id: item.id,
      type: "drag",
      startX: event.clientX,
      startY: event.clientY,
      originX: item.x,
      originY: item.y,
    });
  };

  const startResize = (event, item, handle) => {
    if (!isCanvasMode) return;
    event.preventDefault();
    event.stopPropagation();
    focusWindow(item.id);
    setInteraction({
      id: item.id,
      type: "resize",
      handle,
      startX: event.clientX,
      startY: event.clientY,
      originX: item.x,
      originY: item.y,
      originW: item.w,
      originH: item.h,
    });
  };

  return (
    <div className="rounded-[28px] border border-zinc-200 bg-white/70 p-3 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-zinc-800">
            {isCanvasMode ? "Режим холста" : "Режим симуляции"}
          </div>
          <div className="text-xs text-zinc-500">
            {isCanvasMode
              ? "Выделяйте блок, перетаскивайте его по холсту и тяните за маркеры по краям или углам."
              : "В этом режиме блоки используют сохранённую геометрию, а содержимое остаётся полностью интерактивным."}
          </div>
        </div>
        {isCanvasMode ? (
          <div className="text-xs text-zinc-500">
            PowerPoint-подобное редактирование: выбор, drag, resize.
          </div>
        ) : null}
      </div>

      <div
        ref={workspaceRef}
        className={`relative overflow-auto rounded-[22px] border border-zinc-200 ${
          isCanvasMode
            ? "bg-[radial-gradient(circle_at_1px_1px,#d8dee9_1px,transparent_0)] [background-size:24px_24px]"
            : "bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)]"
        }`}
        style={{ minHeight: `${workspaceHeight}px`, minWidth: `${workspaceWidth}px` }}
      >
        {windows
          .slice()
          .sort((a, b) => a.z - b.z)
          .map((item) => {
            const selected = selectedId === item.id;

            return (
              <div
                key={item.id}
                className={`absolute overflow-visible rounded-[24px] border bg-white shadow-[0_14px_32px_rgba(15,23,42,0.14)] transition-shadow ${
                  selected ? "border-emerald-500 shadow-[0_18px_42px_rgba(16,185,129,0.22)]" : "border-zinc-300"
                } ${isCanvasMode ? "cursor-grab" : ""}`}
                style={{
                  left: item.x,
                  top: item.y,
                  width: item.w,
                  height: item.collapsed ? WINDOW_HEADER_H : item.h,
                  zIndex: item.z,
                }}
                onMouseDown={(event) => {
                  focusWindow(item.id);
                  if (isCanvasMode) {
                    const contentEditor = event.target.closest("[data-canvas-block-content='true']");
                    const interactive = event.target.closest("button, input, textarea, select, label");
                    if (!interactive && !contentEditor) startDrag(event, item);
                  }
                }}
              >
                <div
                  className={`flex h-[46px] items-center justify-between border-b px-3 ${
                    selected
                      ? "border-emerald-200 bg-emerald-50/90"
                      : "border-zinc-200 bg-zinc-50/90"
                  } ${isCanvasMode ? "cursor-grab" : ""}`}
                  onMouseDown={(event) => {
                    event.stopPropagation();
                    if (isCanvasMode) startDrag(event, item);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-800">{item.title}</span>
                    {isCanvasMode ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">canvas</span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="hidden text-[11px] text-zinc-500 sm:block">
                      {Math.round(item.w)} × {Math.round(item.h)}
                    </div>
                    <button
                      type="button"
                      onMouseDown={(event) => event.stopPropagation()}
                      onClick={() => toggleCollapse(item.id)}
                      className="rounded-lg border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100"
                    >
                      {item.collapsed ? "Развернуть" : "Свернуть"}
                    </button>
                  </div>
                </div>

                {!item.collapsed ? (
                  <div className="h-[calc(100%-46px)] overflow-auto p-3">
                    {renderWindow(item)}
                  </div>
                ) : null}

                {isCanvasMode && selected && !item.collapsed ? (
                  <>
                    {["nw", "n", "ne", "e", "se", "s", "sw", "w"].map((handle) => (
                      <button
                        key={handle}
                        type="button"
                        aria-label={`Resize ${item.title} ${handle}`}
                        className="absolute rounded-full border-2 border-white bg-emerald-500 shadow"
                        style={{ ...buildHandleStyle(handle), cursor: getResizeCursor(handle) }}
                        onMouseDown={(event) => startResize(event, item, handle)}
                      />
                    ))}
                  </>
                ) : null}
              </div>
            );
          })}
      </div>
    </div>
  );
}
