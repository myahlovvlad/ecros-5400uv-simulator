import React, { act, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PANEL_ELEMENT_LAYOUT,
  InstrumentPanel,
  PANEL_LABEL_DEFAULTS,
  getPanelSelectionBounds,
  hasPanelDragThresholdPassed,
  resizePanelSelectionFromOrigin,
  togglePanelSelectionIds,
} from "../../src/presentation/components/InstrumentPanel.jsx";

const DEVICE_STUB = {
  screen: "warmup",
  measurements: [],
  kineticPoints: [],
  calibration: { plan: [] },
};

const LCD_ROWS = [
  { text: "TEST", inverted: false },
  { text: "ROW", inverted: false },
];

function cloneLayout(layout = DEFAULT_PANEL_ELEMENT_LAYOUT) {
  return JSON.parse(JSON.stringify(layout));
}

function dispatchMouse(target, type, options = {}) {
  target.dispatchEvent(new MouseEvent(type, { bubbles: true, ...options }));
}

function Harness({ initialSelection = ["titlePlate"], initialLayout = DEFAULT_PANEL_ELEMENT_LAYOUT, onStateChange }) {
  const [layout, setLayout] = useState(() => cloneLayout(initialLayout));
  const [selection, setSelection] = useState(initialSelection);

  useEffect(() => {
    onStateChange?.({ layout, selection });
  }, [layout, onStateChange, selection]);

  return (
    <InstrumentPanel
      device={DEVICE_STUB}
      onAction={() => {}}
      labels={PANEL_LABEL_DEFAULTS}
      selectedFieldId="titleLeft"
      onSelectField={() => {}}
      lcdRowsOverride={LCD_ROWS}
      panelLayoutConfig={{ lcdScale: 3.5 }}
      panelElementLayout={layout}
      selectedElementIds={selection}
      onSelectedElementIdsChange={setSelection}
      onPanelElementLayoutChange={(updater) => {
        setLayout((current) => (typeof updater === "function" ? updater(current) : updater));
      }}
      onDeleteSelectedElements={(ids) => {
        setLayout((current) => {
          const next = cloneLayout(current);
          ids.forEach((id) => {
            if (next[id]) next[id].hidden = true;
          });
          return next;
        });
        setSelection([]);
      }}
      mode="canvas"
    />
  );
}

async function renderHarness(options = {}) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  let latestState = null;

  await act(async () => {
    root.render(<Harness {...options} onStateChange={(state) => { latestState = state; }} />);
  });

  const stage = container.querySelector("[data-panel-stage='true']");
  stage.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    width: 500,
    height: 600,
    right: 500,
    bottom: 600,
  });

  return {
    container,
    root,
    stage,
    getState: () => latestState,
    getElement: (id) => container.querySelector(`[data-panel-element-id='${id}']`),
  };
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    clearRect() {},
    fillRect() {},
    strokeRect() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    imageSmoothingEnabled: false,
  });
});

afterEach(() => {
  document.body.innerHTML = "";
  globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  vi.restoreAllMocks();
});

describe("InstrumentPanel helpers", () => {
  it("detects drag threshold in pixels", () => {
    expect(hasPanelDragThresholdPassed(10, 10, 11, 11)).toBe(false);
    expect(hasPanelDragThresholdPassed(10, 10, 14, 10)).toBe(true);
  });

  it("toggles panel selection ids", () => {
    expect(togglePanelSelectionIds(["file"], "digit1")).toEqual(["file", "digit1"]);
    expect(togglePanelSelectionIds(["file", "digit1"], "file")).toEqual(["digit1"]);
  });

  it("resizes multi-selection bounds proportionally from origin", () => {
    const ids = ["file", "clear"];
    const originLayout = cloneLayout();
    const originBounds = getPanelSelectionBounds(originLayout, ids);
    const next = resizePanelSelectionFromOrigin(originLayout, ids, originBounds, "se", 8, 6);
    const nextBounds = getPanelSelectionBounds(next, ids);

    expect(nextBounds.x).toBeCloseTo(originBounds.x, 5);
    expect(nextBounds.y).toBeCloseTo(originBounds.y, 5);
    expect(nextBounds.w).toBeCloseTo(originBounds.w + 8, 5);
    expect(nextBounds.h).toBeCloseTo(originBounds.h + 6, 5);
  });
});

describe("InstrumentPanel canvas interaction", () => {
  it("keeps empty selection after clicking empty stage", async () => {
    const ui = await renderHarness({ initialSelection: ["titlePlate"] });

    await act(async () => {
      dispatchMouse(ui.stage, "mousedown", { clientX: 480, clientY: 580 });
      dispatchMouse(window, "mouseup", { clientX: 480, clientY: 580 });
    });

    expect(ui.getState().selection).toEqual([]);
  });

  it("uses shift-click for additive selection without starting drag", async () => {
    const ui = await renderHarness({ initialSelection: ["file"] });

    await act(async () => {
      dispatchMouse(ui.getElement("digit1"), "mousedown", { clientX: 120, clientY: 200, shiftKey: true });
      dispatchMouse(window, "mouseup", { clientX: 120, clientY: 200, shiftKey: true });
    });

    expect(ui.getState().selection).toEqual(["file", "digit1"]);
    expect(ui.getState().layout.file.x).toBeCloseTo(DEFAULT_PANEL_ELEMENT_LAYOUT.file.x, 5);
    expect(ui.getState().layout.digit1.x).toBeCloseTo(DEFAULT_PANEL_ELEMENT_LAYOUT.digit1.x, 5);
  });

  it("drags a single element from origin without warp accumulation", async () => {
    const ui = await renderHarness({ initialSelection: ["file"] });

    await act(async () => {
      dispatchMouse(ui.getElement("file"), "mousedown", { clientX: 100, clientY: 100 });
    });

    await act(async () => {
      dispatchMouse(window, "mousemove", { clientX: 115, clientY: 115 });
      dispatchMouse(window, "mousemove", { clientX: 130, clientY: 130 });
      dispatchMouse(window, "mouseup", { clientX: 130, clientY: 130 });
    });

    expect(ui.getState().layout.file.x).toBeCloseTo(DEFAULT_PANEL_ELEMENT_LAYOUT.file.x + 6, 5);
    expect(ui.getState().layout.file.y).toBeGreaterThan(DEFAULT_PANEL_ELEMENT_LAYOUT.file.y + 4);
    expect(ui.getState().layout.file.y).toBeLessThan(DEFAULT_PANEL_ELEMENT_LAYOUT.file.y + 10);
  });

  it("drags the whole selected group after additive selection", async () => {
    const ui = await renderHarness({ initialSelection: ["file"] });

    await act(async () => {
      dispatchMouse(ui.getElement("digit1"), "mousedown", { clientX: 150, clientY: 210, shiftKey: true });
      dispatchMouse(window, "mouseup", { clientX: 150, clientY: 210, shiftKey: true });
    });

    await act(async () => {
      dispatchMouse(ui.getElement("file"), "mousedown", { clientX: 100, clientY: 100 });
    });

    await act(async () => {
      dispatchMouse(window, "mousemove", { clientX: 115, clientY: 115 });
      dispatchMouse(window, "mousemove", { clientX: 130, clientY: 130 });
      dispatchMouse(window, "mouseup", { clientX: 130, clientY: 130 });
    });

    expect(ui.getState().selection).toEqual(["file", "digit1"]);
    expect(ui.getState().layout.file.x).toBeCloseTo(DEFAULT_PANEL_ELEMENT_LAYOUT.file.x + 6, 5);
    expect(ui.getState().layout.file.y).toBeGreaterThan(DEFAULT_PANEL_ELEMENT_LAYOUT.file.y + 4);
    expect(ui.getState().layout.file.y).toBeLessThan(DEFAULT_PANEL_ELEMENT_LAYOUT.file.y + 10);
    expect(ui.getState().layout.digit1.x).toBeCloseTo(DEFAULT_PANEL_ELEMENT_LAYOUT.digit1.x + 6, 5);
    expect(ui.getState().layout.digit1.y).toBeGreaterThan(DEFAULT_PANEL_ELEMENT_LAYOUT.digit1.y + 4);
    expect(ui.getState().layout.digit1.y).toBeLessThan(DEFAULT_PANEL_ELEMENT_LAYOUT.digit1.y + 10);
  });
});
