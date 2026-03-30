import { describe, expect, it, vi } from "vitest";
import { StateBus } from "../../src/application/services/StateBus.js";

describe("StateBus", () => {
  it("emits events to subscribers and supports unsubscribe", () => {
    const handler = vi.fn();
    const unsubscribe = StateBus.on("unit:test", handler);

    StateBus.emit("unit:test", { value: 42 });
    expect(handler).toHaveBeenCalledWith({ value: 42 });

    unsubscribe();
    StateBus.emit("unit:test", { value: 7 });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
