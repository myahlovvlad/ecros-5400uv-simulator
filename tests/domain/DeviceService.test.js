import { beforeEach, describe, expect, it } from "vitest";
import { DeviceService } from "../../src/application/services/DeviceService.js";
import { initialDevice } from "../../src/domain/usecases/index.js";

describe("DeviceService", () => {
  let service;
  let initialState;

  beforeEach(() => {
    service = new DeviceService();
    initialState = initialDevice();
  });

  it("performRezero resets gain and baseline values", () => {
    const { newState, logEntry } = service.performRezero({ ...initialState, gain: 5, lastComputedA: 1.5, lastComputedT: 20 });
    expect(newState.gain).toBe(1);
    expect(newState.lastComputedA).toBe(0);
    expect(newState.lastComputedT).toBe(100);
    expect(logEntry).toContain("rezero ->");
  });

  it("performPhotometryMeasure appends a measurement", () => {
    const { newState } = service.performPhotometryMeasure(initialState);
    expect(newState.measurements).toHaveLength(1);
    expect(newState.measurements[0].index).toBe(1);
  });

  it("deleteFile removes file from the group", () => {
    const { newState, logEntry } = service.deleteFile(initialState, "ФОТОМЕТРИЯ", 0);
    expect(newState.files["ФОТОМЕТРИЯ"]).toHaveLength(initialState.files["ФОТОМЕТРИЯ"].length - 1);
    expect(logEntry).toContain("delete ->");
  });

  it("exportFile marks file exported and creates usb preview", () => {
    const { newState, logEntry } = service.exportFile(initialState, "ФОТОМЕТРИЯ", 0);
    expect(newState.files["ФОТОМЕТРИЯ"][0].exported).toBe(true);
    expect(newState.usbExports).toHaveLength(1);
    expect(logEntry).toContain("USB1(csv)");
  });

  it("getSaveContext returns screen-specific group and extension", () => {
    expect(service.getSaveContext({ screen: "quantCoef" }).ext).toBe(".cof");
    expect(service.getSaveContext({ screen: "kineticsRun" }).ext).toBe(".kin");
    expect(service.getSaveContext({ screen: "calibrationStep" }).ext).toBe(".std");
    expect(service.getSaveContext({ screen: "multiwaveResults" }).ext).toBe(".mwl");
    expect(service.getSaveContext({ screen: "unknown" }).ext).toBe(".qua");
  });

  it("getSampleLabel returns readable sample labels", () => {
    expect(service.getSampleLabel("reference")).toContain("ЭТАЛОН");
    expect(service.getSampleLabel("sampleA")).toContain("ОБРАЗЕЦ");
    expect(service.getSampleLabel("unknown")).toBe("-");
  });

  it("opens saved multiwave files with embedded data", () => {
    const prepared = {
      ...initialState,
      screen: "multiwaveResults",
      previousScreen: "multiwaveResults",
      multiwave: {
        ...initialState.multiwave,
        results: [
          { index: 1, wavelength: 220, energy: 30124, a: 0.421, t: 37.9 },
          { index: 2, wavelength: 260, energy: 28810, a: 0.5021, t: 31.45 },
        ],
      },
    };

    const saveResult = service.saveFile(prepared, "MW_SAVE");
    const savedIndex = saveResult.newState.files["МНОГОВОЛНОВЫЙ"].findIndex((item) => item.name === "MW_SAVE");
    const openResult = service.openFile(saveResult.newState, "МНОГОВОЛНОВЫЙ", savedIndex);
    expect(openResult.error).toBeUndefined();
    expect(openResult.newState.screen).toBe("multiwaveResults");
    expect(openResult.newState.multiwave.results).toHaveLength(2);
  });
});
