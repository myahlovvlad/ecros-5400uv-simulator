import { describe, expect, it } from "vitest";
import {
  absorbanceForSample,
  addNoise,
  buildCalibrationPlan,
  buildUsbExportPreview,
  fileExtByGroup,
  formatMmSs,
  measureSample,
  referenceEnergyAt,
  seedFiles,
  validateFileName,
  validateNumeric,
  validateWavelength,
} from "../../src/domain/usecases/index.js";

describe("referenceEnergyAt", () => {
  it("returns energy in the supported range", () => {
    const energy = referenceEnergyAt(540);
    expect(energy).toBeGreaterThanOrEqual(12000);
    expect(energy).toBeLessThanOrEqual(60000);
  });

  it("changes with wavelength", () => {
    expect(referenceEnergyAt(190)).not.toBe(referenceEnergyAt(540));
    expect(referenceEnergyAt(540)).not.toBe(referenceEnergyAt(1100));
  });
});

describe("absorbanceForSample", () => {
  it("returns 0 for reference", () => {
    expect(absorbanceForSample("reference", 540)).toBe(0);
  });

  it("returns 3.2 for empty position", () => {
    expect(absorbanceForSample("empty", 540)).toBe(3.2);
  });

  it("produces stronger peak near 505 nm for sampleA", () => {
    expect(absorbanceForSample("sampleA", 505)).toBeGreaterThan(absorbanceForSample("sampleA", 400));
  });

  it("grows over time for kinetic sample", () => {
    expect(absorbanceForSample("kinetic", 546, 60)).toBeGreaterThan(absorbanceForSample("kinetic", 546, 10));
  });
});

describe("measureSample", () => {
  const baseParams = {
    sample: "reference",
    wavelength: 546,
    gain: 1,
    e100: 33869,
    darkValues: [39, 74, 152, 302, 585, 1079, 1880, 3148],
  };

  it("returns dark, energy, t and a", () => {
    const result = measureSample(baseParams);
    expect(result).toMatchObject({
      dark: expect.any(Number),
      energy: expect.any(Number),
      t: expect.any(Number),
      a: expect.any(Number),
    });
  });

  it("uses gain to select dark value", () => {
    const result = measureSample({ ...baseParams, gain: 3, darkValues: [1, 2, 3, 4, 5, 6, 7, 8], sample: "empty" });
    expect(result.dark).toBe(3);
  });
});

describe("addNoise", () => {
  it("stays within amplitude bounds", () => {
    const base = 1000;
    const value = addNoise(base, 10);
    expect(value).toBeGreaterThanOrEqual(base - 10);
    expect(value).toBeLessThanOrEqual(base + 10);
  });
});

describe("buildCalibrationPlan", () => {
  it("creates standards x parallels steps", () => {
    const plan = buildCalibrationPlan(3, 2);
    expect(plan).toHaveLength(6);
    expect(plan[0].code).toBe("С-1-1");
    expect(plan[5].code).toBe("С-3-2");
  });
});

describe("formatMmSs", () => {
  it("formats values as mm:ss", () => {
    expect(formatMmSs(0)).toBe("00:00");
    expect(formatMmSs(61)).toBe("01:01");
  });
});

describe("fileExtByGroup", () => {
  it("maps groups to extensions", () => {
    expect(fileExtByGroup("ФОТОМЕТРИЯ")).toBe(".qua");
    expect(fileExtByGroup("ГРАДУИРОВКА")).toBe(".std");
    expect(fileExtByGroup("КОЭФФИЦИЕНТ")).toBe(".cof");
    expect(fileExtByGroup("КИНЕТИКА")).toBe(".kin");
  });
});

describe("seedFiles", () => {
  it("returns four file groups", () => {
    expect(Object.keys(seedFiles())).toHaveLength(4);
  });
});

describe("validation helpers", () => {
  it("validates file names", () => {
    expect(validateFileName("TestFile").valid).toBe(true);
    expect(validateFileName("").valid).toBe(false);
    expect(validateFileName("A".repeat(19)).valid).toBe(false);
  });

  it("validates wavelength", () => {
    expect(validateWavelength(546.2)).toMatchObject({ valid: true, value: 546.2 });
    expect(validateWavelength("abc").valid).toBe(false);
  });

  it("validates numeric fields", () => {
    expect(validateNumeric(5, 0, 10, "TEST").value).toBe(5);
    expect(validateNumeric(15, 0, 10, "TEST").value).toBe(10);
    expect(validateNumeric("abc", 0, 10, "TEST").valid).toBe(false);
  });
});

describe("buildUsbExportPreview", () => {
  it("builds photometry csv preview", () => {
    const preview = buildUsbExportPreview({
      group: "ФОТОМЕТРИЯ",
      name: "TEST",
      ext: ".qua",
      measurements: [{ index: 1, wavelength: 540, energy: 123, a: 0.1, t: 98.2 }],
      calibrationPlan: [],
      kineticPoints: [],
      wavelength: 540,
      quantK: 1,
      quantB: 0,
      lastA: 0.1,
    });

    expect(preview).toContain("FILE=TEST.qua");
    expect(preview).toContain("index,wavelength_nm,energy,A,T_percent");
  });
});
