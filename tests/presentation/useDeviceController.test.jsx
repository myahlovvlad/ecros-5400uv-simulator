import React, { useEffect } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DeviceService } from "../../src/application/services/DeviceService.js";
import { useDeviceController } from "../../src/presentation/hooks/useDeviceController.js";

function HookHarness({ initialDeviceState, services, onUpdate }) {
  const controller = useDeviceController(initialDeviceState, services);

  useEffect(() => {
    onUpdate(controller);
  }, [controller, onUpdate]);

  return null;
}

async function renderHookHarness({ initialDeviceState = null, services = {} } = {}) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  let latest = null;

  await act(async () => {
    root.render(
      <HookHarness
        initialDeviceState={initialDeviceState}
        services={services}
        onUpdate={(controller) => {
          latest = controller;
        }}
      />,
    );
  });

  return {
    root,
    getLatest: () => latest,
  };
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  document.body.innerHTML = "";
  globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useDeviceController", () => {
  it("routes photometry graph FILE to saveDialog", async () => {
    const harness = await renderHookHarness({
      initialDeviceState: {
        screen: "photometryGraph",
        measurements: [{ index: 1, wavelength: 546.2, a: 0.123, t: 75, energy: 12345 }],
      },
    });

    await act(async () => {
      harness.getLatest().handleAction("FILE");
    });

    expect(harness.getLatest().device.screen).toBe("saveDialog");
    expect(harness.getLatest().device.saveMeta.group).toBe("ФОТОМЕТРИЯ");
  });

  it("converts multiwave runtime errors into warning screen state", async () => {
    vi.useFakeTimers();
    const failingService = Object.assign(new DeviceService(), {
      performMultiWaveMeasure() {
        throw new Error("boom");
      },
    });

    const harness = await renderHookHarness({
      initialDeviceState: {
        screen: "multiWaveRun",
        multiWaveCount: 1,
      },
      services: { deviceService: failingService },
    });

    await act(async () => {
      const promise = harness.getLatest().performMultiWaveRun();
      await vi.runAllTimersAsync();
      await promise;
    });

    expect(harness.getLatest().device.screen).toBe("warning");
    expect(harness.getLatest().device.warningReturn).toBe("multiWaveRun");
    expect(harness.getLatest().device.logLines.at(-1).text).toContain("error: performMultiWaveRun");
  });
});
