import React, { useEffect } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DeviceProvider, useDevice, useDeviceSelector } from "../../src/presentation/contexts/DeviceContext.jsx";

function Probe() {
  const screen = useDeviceSelector((device) => device.screen);
  const { setDevice } = useDevice();

  useEffect(() => {
    setDevice((current) => ({ ...current, screen: "multiWaveMenu" }));
  }, [setDevice]);

  return <div data-testid="screen">{screen}</div>;
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  document.body.innerHTML = "";
  globalThis.IS_REACT_ACT_ENVIRONMENT = false;
});

describe("DeviceContext", () => {
  it("provides selected device state through useDeviceSelector", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <DeviceProvider initialDeviceState={{ screen: "photometry" }}>
          <Probe />
        </DeviceProvider>,
      );
    });

    expect(container.textContent).toContain("multiWaveMenu");
  });
});
