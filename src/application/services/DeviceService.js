import {
  addNoise,
  buildUsbExportPreview,
  fileExtByGroup,
  findNextPendingStep,
  measureSample,
  referenceEnergyAt,
  validateFileName,
  validateNumeric,
  validateWavelength,
} from "../../domain/usecases/index.js";
import { DARK_VALUES, SAMPLE_OPTIONS } from "../../domain/constants/index.js";

export class DeviceService {
  performRezero(state) {
    const e100 = addNoise(referenceEnergyAt(state.wavelength), 10);

    return {
      newState: {
        ...state,
        e100,
        gain: 1,
        lastEnergy: e100,
        lastComputedA: 0,
        lastComputedT: 100,
      },
      logEntry: `rezero -> ${e100}`,
    };
  }

  performPhotometryMeasure(state) {
    const measurement = measureSample({
      sample: state.currentSample,
      wavelength: state.wavelength,
      gain: state.gain,
      e100: state.e100,
      darkValues: state.darkValues,
    });

    const nextMeasurements = [
      ...state.measurements,
      { index: state.measurements.length + 1, wavelength: state.wavelength, ...measurement },
    ].slice(-100);

    return {
      newState: {
        ...state,
        lastEnergy: measurement.energy,
        lastComputedA: measurement.a,
        lastComputedT: measurement.t,
        measurements: nextMeasurements,
        measurementCursor: nextMeasurements.length ? nextMeasurements.length - 1 : 0,
      },
      logEntry: `ge 1 -> ${measurement.energy}`,
      measurement,
    };
  }

  performCalibrationMeasure(state) {
    const measurement = measureSample({
      sample: state.currentSample,
      wavelength: state.wavelength,
      gain: state.gain,
      e100: state.e100,
      darkValues: state.darkValues,
    });

    const plan = [...state.calibration.plan];
    const step = plan[state.calibration.stepIndex];
    plan[state.calibration.stepIndex] = { ...step, result: measurement, status: "done" };

    return {
      newState: {
        ...state,
        lastEnergy: measurement.energy,
        lastComputedA: measurement.a,
        lastComputedT: measurement.t,
        calibration: {
          ...state.calibration,
          plan,
          resultCursor: state.calibration.stepIndex,
        },
        screen: "calibrationJournal",
      },
      logEntry: `calibration -> ${step?.code ?? "-"}`,
      measurement,
    };
  }

  performCalibrationUnknownMeasure(state) {
    const measurement = measureSample({
      sample: state.currentSample,
      wavelength: state.wavelength,
      gain: state.gain,
      e100: state.e100,
      darkValues: state.darkValues,
    });

    return {
      newState: {
        ...state,
        lastEnergy: measurement.energy,
        lastComputedA: measurement.a,
        lastComputedT: measurement.t,
      },
      logEntry: `unknown -> ${state.calibration?.currentUnknownNo ?? 1}`,
      measurement,
    };
  }

  performQuantCoefMeasure(state) {
    const measurement = measureSample({
      sample: state.currentSample,
      wavelength: state.wavelength,
      gain: state.gain,
      e100: state.e100,
      darkValues: state.darkValues,
    });

    return {
      newState: {
        ...state,
        lastEnergy: measurement.energy,
        lastComputedA: measurement.a,
        lastComputedT: measurement.t,
      },
      logEntry: `coef -> ${state.quantCoefContext?.currentUnknownNo ?? 1}`,
      measurement,
    };
  }

  performDarkCurrent(state) {
    const values = DARK_VALUES.map((value, index) => addNoise(value + index * 2, 4));
    return {
      newState: {
        ...state,
        darkValues: values,
      },
      logEntry: `resetdark -> ${values.join(", ")}`,
    };
  }

  performWavelengthCalibration(state) {
    return {
      newState: state,
      logEntry: "adjustwl -> ok",
    };
  }

  nextCalibrationStep(state) {
    const nextIndex = findNextPendingStep(state.calibration.plan, state.calibration.stepIndex);
    if (nextIndex === -1) {
      return { newState: { ...state, screen: "calibrationGraph" } };
    }

    return {
      newState: {
        ...state,
        calibration: {
          ...state.calibration,
          stepIndex: nextIndex,
        },
        screen: "calibrationStep",
      },
    };
  }

  deleteFile(state, group, index) {
    const files = [...(state.files[group] || [])];
    const selected = files[index];
    const nextFiles = files.filter((_, fileIndex) => fileIndex !== index);

    return {
      newState: {
        ...state,
        files: { ...state.files, [group]: nextFiles },
        screen: "fileList",
        fileListIndex: Math.max(0, Math.min(state.fileListIndex, nextFiles.length - 1)),
      },
      logEntry: `delete -> ${selected.name}${selected.ext}`,
      fileName: `${selected.name}${selected.ext}`,
    };
  }

  exportFile(state, group, index) {
    const files = [...(state.files[group] || [])];
    const selected = files[index];
    const nextFiles = [...files];
    nextFiles[index] = { ...selected, exported: true };

    const usbRecord = {
      id: `${Date.now()}-${selected.name}`,
      target: "USB1",
      group,
      name: selected.name,
      ext: selected.ext,
      content: buildUsbExportPreview({
        group,
        name: selected.name,
        ext: selected.ext,
        measurements: state.measurements,
        calibrationPlan: state.calibration.plan,
        calibrationUnknownResults: state.calibration?.unknownResults,
        kineticPoints: state.kineticPoints,
        wavelength: state.wavelength,
        quantK: state.quantK,
        quantB: state.quantB,
        lastA: state.lastComputedA,
        multiwlResults: state.multiwlResults,
        quantCoefResults: state.quantCoefContext?.results,
      }),
      exportedAt: new Date().toLocaleString(),
    };

    return {
      newState: {
        ...state,
        files: { ...state.files, [group]: nextFiles },
        usbExports: [...state.usbExports, usbRecord],
        usbPreviewIndex: state.usbExports.length,
        screen: "fileList",
      },
      logEntry: `export -> ${selected.name}${selected.ext} -> USB1(csv)`,
    };
  }

  renameFile(state, group, index, newName) {
    const validation = validateFileName(newName);
    if (!validation.valid) {
      return {
        newState: state,
        error: { title: validation.error, body: "ИСПРАВЬТЕ ИМЯ ФАЙЛА", returnScreen: "fileActionMenu" },
      };
    }

    const normalizedName = validation.value;
    const files = [...(state.files[group] || [])];
    const selected = files[index];

    if (files.some((file, fileIndex) => fileIndex !== index && file.name === normalizedName)) {
      return {
        newState: state,
        error: { title: "ИМЯ УЖЕ ЕСТЬ", body: "ВЫБЕРИТЕ ДРУГОЕ ИМЯ", returnScreen: "fileActionMenu" },
      };
    }

    files[index] = { ...selected, name: normalizedName };

    return {
      newState: {
        ...state,
        files: { ...state.files, [group]: files },
        screen: "fileList",
        inputBuffer: "",
        inputTarget: null,
      },
    };
  }

  saveFile(state, name) {
    const validation = validateFileName(name);
    if (!validation.valid) {
      return {
        newState: state,
        error: { title: validation.error, body: "ВВЕДИТЕ ИМЯ ФАЙЛА", returnScreen: "saveDialog" },
      };
    }

    const normalizedName = validation.value;
    const group = state.saveMeta.group;
    const ext = state.saveMeta.suggestedExt;
    const items = [...(state.files[group] || [])];

    if (items.some((file) => file.name === normalizedName)) {
      return {
        newState: state,
        error: { title: "ИМЯ УЖЕ ЕСТЬ", body: "НУЖНО ДРУГОЕ ИМЯ", returnScreen: "saveDialog" },
      };
    }

    items.push({ name: normalizedName, ext, exported: false });

    return {
      newState: {
        ...state,
        files: { ...state.files, [group]: items },
        inputBuffer: "",
        inputTarget: null,
        screen: state.previousScreen || "main",
      },
      logEntry: `save -> ${normalizedName}${ext}`,
    };
  }

  setWavelength(state, value) {
    const validation = validateWavelength(value);
    if (!validation.valid) {
      return {
        newState: state,
        error: { title: "ОШИБКА", body: validation.error, returnScreen: state.returnScreen },
      };
    }

    return {
      newState: {
        ...state,
        wavelength: validation.value,
        inputBuffer: "",
        inputTarget: null,
        screen: state.returnScreen,
      },
      logEntry: `swl ${validation.value.toFixed(1)}`,
    };
  }

  setQuantCoefficient(state, type, value) {
    const validation = validateNumeric(value, -999999, 999999, type);
    if (!validation.valid) {
      return {
        newState: state,
        error: { title: "ОШИБКА", body: validation.error, returnScreen: "quantCoef" },
      };
    }

    return {
      newState: {
        ...state,
        [type === "K" ? "quantK" : "quantB"]: validation.value,
        inputBuffer: "",
        inputTarget: null,
        screen: "quantCoef",
      },
    };
  }

  setKineticParameter(state, type, value) {
    let validation;

    if (type === "upper") validation = validateNumeric(value, -10, 10, "ВЕРХ. ГРАНИЦА");
    if (type === "lower") validation = validateNumeric(value, -10, 10, "НИЖ. ГРАНИЦА");
    if (type === "duration") {
      validation = validateNumeric(value, 10, 1200, "ВРЕМЯ");
      if (validation.valid) validation.value = Math.round(validation.value);
    }

    if (!validation?.valid) {
      return {
        newState: state,
        error: { title: "ОШИБКА", body: validation?.error ?? "НЕВЕРНОЕ ЗНАЧЕНИЕ", returnScreen: "kineticsMenu" },
      };
    }

    return {
      newState: {
        ...state,
        [`kinetic${type.charAt(0).toUpperCase()}${type.slice(1)}`]: validation.value,
        inputBuffer: "",
        inputTarget: null,
        screen: "kineticsMenu",
      },
    };
  }

  getSaveContext(state) {
    if (["quantCoef", "quantCoefPaused", "quantCoefNext"].includes(state.screen)) return { group: "КОЭФФИЦИЕНТ", ext: fileExtByGroup("КОЭФФИЦИЕНТ") };
    if (["kineticsRun", "kineticsGraph", "kineticsMenu"].includes(state.screen)) {
      return { group: "КИНЕТИКА", ext: fileExtByGroup("КИНЕТИКА") };
    }
    if (["calibrationStep", "calibrationJournal", "calibrationGraph", "calibrationPlan", "calibrationUnknown", "calibrationUnknownNext"].includes(state.screen)) {
      return { group: "ГРАДУИРОВКА", ext: fileExtByGroup("ГРАДУИРОВКА") };
    }
    if (["multiwlRun", "multiwlMain", "multiwlFormula"].includes(state.screen)) {
      return { group: "МНОГОВОЛН", ext: fileExtByGroup("МНОГОВОЛН") };
    }
    return { group: "ФОТОМЕТРИЯ", ext: fileExtByGroup("ФОТОМЕТРИЯ") };
  }

  getSampleLabel(sampleValue) {
    return SAMPLE_OPTIONS.find((sample) => sample.value === sampleValue)?.label ?? "-";
  }
}
