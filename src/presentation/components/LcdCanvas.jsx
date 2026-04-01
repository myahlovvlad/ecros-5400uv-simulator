import React, { useEffect, useMemo, useRef } from "react";
import { LCD_H, LCD_SCALE, LCD_W } from "../../domain/constants/index.js";
import { getLcdRows, getRenderableRows, LCDRenderer } from "../../infrastructure/adapters/LcdRenderer.js";

const LCD_FG = "#0f172a";
const LCD_BG = "#edf2ed";
const LCD_GRID_COLOR = "rgba(15, 23, 42, 0.18)";
const LCD_MARGIN = 3;
const GLYPH_H = 8;

function drawText(ctx, text, x, y) {
  ctx.fillStyle = LCD_FG;
  ctx.font = "8px monospace";
  ctx.textBaseline = "top";
  ctx.fillText(text, x, y);
}

function renderGraph(ctx, values, { minY, maxY, title, xLabel, yLabel }) {
  const x0 = 15;
  const y0 = 11;
  const width = 100;
  const height = 40;

  ctx.clearRect(0, 0, LCD_W, LCD_H);
  ctx.fillStyle = LCD_BG;
  ctx.fillRect(0, 0, LCD_W, LCD_H);
  ctx.strokeStyle = LCD_FG;
  ctx.lineWidth = 1;
  ctx.strokeRect(x0, y0, width, height);

  drawText(ctx, title.slice(0, 18), LCD_MARGIN, LCD_MARGIN);
  drawText(ctx, yLabel.slice(0, 1), LCD_MARGIN, y0 + 1);
  drawText(ctx, xLabel.slice(0, 2), x0 + width - 10, y0 + height + 2);
  drawText(ctx, String(maxY.toFixed(2)).slice(0, 5), LCD_MARGIN, y0 + 1);
  drawText(ctx, String(minY.toFixed(2)).slice(0, 5), LCD_MARGIN, y0 + height - 6);

  if (!values.length) {
    drawText(ctx, "НЕТ ДАННЫХ", 28, 30);
    return;
  }

  const safeMin = Number.isFinite(minY) ? minY : Math.min(...values);
  const safeMax = Number.isFinite(maxY) ? maxY : Math.max(...values) || safeMin + 1;
  const range = Math.max(0.0001, safeMax - safeMin);

  ctx.beginPath();
  values.forEach((value, index) => {
    const pointX = x0 + (index / Math.max(1, values.length - 1)) * (width - 2) + 1;
    const pointY = y0 + height - 1 - ((value - safeMin) / range) * (height - 2);
    if (index === 0) ctx.moveTo(pointX, pointY);
    else ctx.lineTo(pointX, pointY);
  });
  ctx.stroke();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function LcdCanvas({
  device,
  scale = LCD_SCALE,
  rowsOverride = null,
  editorEnabled = false,
  selectedRowIndex = null,
  titleUnderline = false,
  glyphOverrides = null,
  onSelectRow,
  onMoveRow,
  onCanvasReady,
}) {
  const ref = useRef(null);
  const dragStateRef = useRef(null);
  const rows = useMemo(() => rowsOverride ?? getLcdRows(device), [device, rowsOverride]);
  const renderableRows = useMemo(() => getRenderableRows(rows, { glyphOverrides }), [glyphOverrides, rows]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    onCanvasReady?.(canvas);
  }, [onCanvasReady]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.imageSmoothingEnabled = false;

    const frameId = window.requestAnimationFrame(() => {
      if (!rowsOverride && device.screen === "photometryGraph") {
        renderGraph(ctx, device.measurements.map((measurement) => measurement.a), {
          minY: 0,
          maxY: Math.max(1, ...device.measurements.map((measurement) => measurement.a), 1),
          title: "ГРАФИК ФОТОМЕТР.",
          xLabel: "№",
          yLabel: "A",
        });
        return;
      }

      if (!rowsOverride && device.screen === "kineticsGraph") {
        renderGraph(ctx, device.kineticPoints.map((point) => point.value), {
          minY: device.kineticLower,
          maxY: Math.max(device.kineticUpper, ...device.kineticPoints.map((point) => point.value), device.kineticUpper),
          title: "КИНЕТИЧ. КРИВАЯ",
          xLabel: "С",
          yLabel: "A",
        });
        return;
      }

      if (!rowsOverride && device.screen === "calibrationGraph") {
        const values = device.calibration.plan.filter((step) => step.result).map((step) => step.result.a);
        renderGraph(ctx, values, {
          minY: 0,
          maxY: Math.max(1, ...values, 1),
          title: "ТЕКУЩАЯ ГРАДУИР.",
          xLabel: "№",
          yLabel: "A",
        });
        return;
      }

      LCDRenderer.render(ctx, rows, { editorEnabled, selectedRowIndex, titleUnderline, glyphOverrides });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [device, editorEnabled, glyphOverrides, rows, rowsOverride, selectedRowIndex, titleUnderline]);

  const getCanvasPoint = (event) => {
    const canvas = ref.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * LCD_W,
      y: ((event.clientY - rect.top) / rect.height) * LCD_H,
    };
  };

  const handlePointerDown = (event) => {
    if (!editorEnabled || !onMoveRow) return;
    const point = getCanvasPoint(event);
    if (!point) return;

    const hitIndex = [...renderableRows]
      .map((row, index) => ({ row, index }))
      .reverse()
      .find(({ row }) => (
        point.x >= row.x - 2 &&
        point.x <= row.x + row.width + 2 &&
        point.y >= row.y - 2 &&
        point.y <= row.y + row.height + 2
      ))?.index;

    if (typeof hitIndex !== "number") return;

    const row = renderableRows[hitIndex];
    onSelectRow?.(hitIndex);
    dragStateRef.current = {
      index: hitIndex,
      offsetX: point.x - row.x,
      offsetY: point.y - row.y,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!editorEnabled || !dragStateRef.current || !onMoveRow) return;
    const point = getCanvasPoint(event);
    if (!point) return;
    const { index, offsetX, offsetY } = dragStateRef.current;
    const row = renderableRows[index];
    const nextX = clamp(Math.round(point.x - offsetX), 0, Math.max(0, LCD_W - row.width - LCD_MARGIN));
    const nextY = clamp(Math.round(point.y - offsetY), 0, Math.max(0, LCD_H - GLYPH_H - LCD_MARGIN));
    onMoveRow(index, { x: nextX, y: nextY });
  };

  const handlePointerUp = (event) => {
    dragStateRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  return (
    <div
      data-testid="lcd-canvas-frame"
      className="relative overflow-hidden rounded-md border-4 border-zinc-200 bg-[#edf2ed] shadow-inner"
      style={{
        width: "100%",
        maxWidth: `${LCD_W * scale}px`,
        aspectRatio: `${LCD_W} / ${LCD_H}`,
      }}
    >
      <canvas
        ref={ref}
        data-testid="lcd-canvas"
        width={LCD_W}
        height={LCD_H}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          width: "100%",
          height: "100%",
          imageRendering: "pixelated",
          display: "block",
          cursor: editorEnabled ? "move" : "default",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to right, ${LCD_GRID_COLOR} 1px, transparent 1px), linear-gradient(to bottom, ${LCD_GRID_COLOR} 1px, transparent 1px)`,
          backgroundSize: `${scale}px ${scale}px`,
          opacity: 0.95,
        }}
      />
    </div>
  );
}
