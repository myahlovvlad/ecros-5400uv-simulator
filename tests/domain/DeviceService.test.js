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

  it("performMultiWaveMeasure appends a multiwave run and graph data", () => {
    const { newState, measurement } = service.performMultiWaveMeasure(initialState);
    expect(newState.multiWaveMeasurements).toHaveLength(1);
    expect(newState.multiWaveMeasurements[0].index).toBe(1);
    expect(newState.multiWaveGraphData).toHaveLength(initialState.multiWaveCount);
    expect(measurement.points).toHaveLength(initialState.multiWaveCount);
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
    expect(service.getSaveContext({ screen: "multiWaveRun" }).ext).toBe(".mwv");
    expect(service.getSaveContext({ screen: "unknown" }).ext).toBe(".qua");
  });

  it("getSampleLabel returns readable sample labels", () => {
    expect(service.getSampleLabel("reference")).toContain("ЭТАЛОН");
    expect(service.getSampleLabel("sampleA")).toContain("ОБРАЗЕЦ");
    expect(service.getSampleLabel("unknown")).toBe("-");
  });
});
