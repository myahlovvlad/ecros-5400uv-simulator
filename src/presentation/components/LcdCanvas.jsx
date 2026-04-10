/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useMemo, useRef } from "react";
import { LCD_H, LCD_SCALE, LCD_W } from "../../domain/constants/index.js";
import { debugError, debugLog } from "../utils/debug.js";
import {
  FONT_BITMAP,
  getGlyphBitmap,
  getGlyphVerticalMetrics,
  LCD_BG,
  LCD_FG,
  LCD_TEXT_MAX_WIDTH,
  measureBitmapTextWidth,
  normalizeFontChar,
  renderDeviceToMatrix,
} from "../utils/lcdBitmap.js";

const LCD_GRID_COLOR = "rgba(22, 32, 51, 0.12)";

function paintMatrix(ctx, matrix) {
  ctx.fillStyle = LCD_BG;
  ctx.fillRect(0, 0, LCD_W, LCD_H);
  ctx.fillStyle = LCD_FG;
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) ctx.fillRect(x, y, 1, 1);
    });
  });
}

export function LcdCanvas({ device, scale = LCD_SCALE, rowsOverride = null, canvasRef = null }) {
  const ref = useRef(null);
  const matrix = useMemo(() => renderDeviceToMatrix(device, rowsOverride), [device, rowsOverride]);

  useEffect(() => {
    if (!canvasRef) return undefined;
    canvasRef.current = ref.current;
    return () => {
      if (canvasRef) canvasRef.current = null;
    };
  }, [canvasRef]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    try {
      paintMatrix(ctx, matrix);
      debugLog("LcdCanvas", "rendered", device.screen);
    } catch (error) {
      debugError("LcdCanvas.render", error, { screen: device.screen });
      paintMatrix(ctx, renderDeviceToMatrix(device, [
        { text: "LCD ERROR", inverted: true },
        { text: "CHECK CONSOLE" },
        { text: String(error?.message ?? "UNKNOWN").slice(0, 20) },
      ]));
    }
  }, [device, matrix]);

  return (
    <div
      className="relative rounded-md border-4 border-[#d7e3cf] bg-[#eef4e6] shadow-[inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-6px_16px_rgba(120,140,110,0.12)]"
      style={{ width: `${LCD_W * scale}px`, height: `${LCD_H * scale}px` }}
    >
      <canvas
        ref={ref}
        width={LCD_W}
        height={LCD_H}
        style={{
          width: `${LCD_W * scale}px`,
          height: `${LCD_H * scale}px`,
          imageRendering: "pixelated",
          display: "block",
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

export {
  FONT_BITMAP,
  getGlyphBitmap,
  getGlyphVerticalMetrics,
  LCD_TEXT_MAX_WIDTH,
  measureBitmapTextWidth,
  normalizeFontChar,
};
