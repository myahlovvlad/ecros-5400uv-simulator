import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CliEmulator } from "../../src/presentation/components/CliEmulator.jsx";

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  document.body.innerHTML = "";
  globalThis.IS_REACT_ACT_ENVIRONMENT = false;
});

describe("CliEmulator", () => {
  it("renders normalized log line objects with stable ids", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const onExecute = vi.fn();

    await act(async () => {
      root.render(
        <CliEmulator
          logLines={[
            { id: "line-1", text: "> help" },
            { id: "line-2", text: "Command List:" },
          ]}
          onExecute={onExecute}
        />,
      );
    });

    expect(container.textContent).toContain("> help");
    expect(container.textContent).toContain("Command List:");
  });
});
