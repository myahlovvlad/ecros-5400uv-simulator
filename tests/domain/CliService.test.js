import { describe, expect, it, vi } from "vitest";
import { CliService } from "../../src/application/services/CliService.js";
import { initialDevice } from "../../src/domain/usecases/index.js";

describe("CliService", () => {
  it("reports unknown commands as explicit errors", async () => {
    const service = new CliService();
    const log = vi.fn();

    await service.execute("wat", initialDevice(), log, vi.fn(), vi.fn());

    expect(log).toHaveBeenCalledWith("> wat");
    expect(log).toHaveBeenCalledWith("error: unknown command");
  });

  it("validates wavelength range before changing state", async () => {
    const service = new CliService();
    const log = vi.fn();
    const setState = vi.fn();

    await service.execute("swl 9999", initialDevice(), log, setState, vi.fn());

    expect(setState).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith("error: wavelength must be 190-1100 nm");
  });
});
