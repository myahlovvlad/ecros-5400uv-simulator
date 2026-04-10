import {
  addNoise,
  buildMultiWaveMeasurement,
  buildUsbExportPreview,
  fileExtByGroup,
  findNextPendingStep,
  measureSample,
  referenceEnergyAt,
  validateFileName,
  validateNumeric,
  validateWavelength,
} from "../../domain/usecases/index.js";
import {
  DARK_VALUES,
  MULTI_WAVE_MAX_COUNT,
  MULTI_WAVE_MIN_COUNT,
  SAMPLE_OPTIONS,
  WL_MIN,
} from "../../domain/constants/index.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

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
    };
  }

  performMultiWaveMeasure(state) {
    const measurement = buildMultiWaveMeasurement(state);
    const nextMeasurements = [...(state.multiWaveMeasurements ?? []), measurement].slice(-100);
    const lastPoint = measurement.points.at(-1);

    return {
      newState: {
        ...state,
        multiWaveMeasurements: nextMeasurements,
        multiWaveMeasurementCursor: nextMeasurements.length ? nextMeasurements.length - 1 : 0,
        multiWaveGraphData: measurement.points.map((point) => ({
          wavelength: point.wavelength,
          value: point.value,
          a: point.a,
          t: point.t,
          energy: point.energy,
        })),
        lastEnergy: lastPoint?.energy ?? state.lastEnergy,
        lastComputedA: lastPoint?.a ?? state.lastComputedA,
        lastComputedT: lastPoint?.t ?? state.lastComputedT,
        screen: "multiWaveJournal",
      },
      logEntry: `multiwave -> run ${measurement.index} (${measurement.points.length} wl)`,
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
      logEntry: selected ? `delete -> ${selected.name}${selected.ext}` : "delete -> skipped",
      fileName: selected ? `${selected.name}${selected.ext}` : "",
    };
  }

  exportFile(state, group, index) {
    const files = [...(state.files[group] || [])];
    const selected = files[index];
    if (!selected) {
      return {
        newState: state,
        logEntry: "export -> skipped",
      };
    }

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
        kineticPoints: state.kineticPoints,
        multiWaveMeasurements: state.multiWaveMeasurements ?? [],
        wavelength: state.wavelength,
        quantK: state.quantK,
        quantB: state.quantB,
        lastA: state.lastComputedA,
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
    if (!selected) {
      return {
        newState: state,
        error: { title: "НЕТ ФАЙЛА", body: "ВЫБЕРИТЕ ФАЙЛ", returnScreen: "fileList" },
      };
    }

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

  setMultiWaveCount(state, value) {
    const validation = validateNumeric(value, MULTI_WAVE_MIN_COUNT, MULTI_WAVE_MAX_COUNT, "ЧИСЛО ВОЛН");
    if (!validation.valid) {
      return {
        newState: state,
        error: { title: "ОШИБКА", body: validation.error, returnScreen: "multiWaveMenu" },
      };
    }

    const count = clamp(Math.round(validation.value), MULTI_WAVE_MIN_COUNT, MULTI_WAVE_MAX_COUNT);
    const wavelengths = [...(state.multiWaveWavelengths ?? [])];
    while (wavelengths.length < MULTI_WAVE_MAX_COUNT) {
      wavelengths.push(WL_MIN + wavelengths.length * 100);
    }

    return {
      newState: {
        ...state,
        multiWaveCount: count,
        multiWaveSetupIndex: clamp(state.multiWaveSetupIndex ?? 0, 0, count - 1),
        multiWaveWavelengths: wavelengths.slice(0, MULTI_WAVE_MAX_COUNT),
        inputBuffer: "",
        inputTarget: null,
        screen: "multiWaveSetup",
      },
    };
  }

  setMultiWaveParallelCount(state, value) {
    const validation = validateNumeric(value, MULTI_WAVE_MIN_COUNT, MULTI_WAVE_MAX_COUNT, "ПАРАЛ. ИЗМ.");
    if (!validation.valid) {
      return {
        newState: state,
        error: { title: "ОШИБКА", body: validation.error, returnScreen: "multiWaveMenu" },
      };
    }

    return {
      newState: {
        ...state,
        multiWaveParallelCount: clamp(Math.round(validation.value), MULTI_WAVE_MIN_COUNT, MULTI_WAVE_MAX_COUNT),
        inputBuffer: "",
        inputTarget: null,
        screen: "multiWaveMenu",
      },
    };
  }

  setMultiWaveWavelength(state, targetIndex, value) {
    const validation = validateWavelength(value);
    if (!validation.valid) {
      return {
        newState: state,
        error: { title: "ОШИБКА", body: validation.error, returnScreen: "multiWaveSetup" },
      };
    }

    const wavelengths = [...(state.multiWaveWavelengths ?? [])];
    wavelengths[targetIndex] = validation.value;

    return {
      newState: {
        ...state,
        multiWaveWavelengths: wavelengths,
        inputBuffer: "",
        inputTarget: null,
        screen: "multiWaveSetup",
      },
      logEntry: `mw-wl[${targetIndex + 1}] ${validation.value.toFixed(1)}`,
    };
  }

  getSaveContext(state) {
    if (state.screen === "quantCoef") return { group: "КОЭФФИЦИЕНТ", ext: fileExtByGroup("КОЭФФИЦИЕНТ") };
    if (["kineticsRun", "kineticsGraph", "kineticsMenu"].includes(state.screen)) {
      return { group: "КИНЕТИКА", ext: fileExtByGroup("КИНЕТИКА") };
    }
    if (["multiWaveMenu", "multiWaveRun", "multiWaveJournal", "multiWaveGraph", "multiWaveSetup"].includes(state.screen)) {
      return { group: "МНОГОВОЛН.", ext: fileExtByGroup("МНОГОВОЛН.") };
    }
    if (["calibrationStep", "calibrationJournal", "calibrationGraph", "calibrationPlan"].includes(state.screen)) {
      return { group: "ГРАДУИРОВКА", ext: fileExtByGroup("ГРАДУИРОВКА") };
    }
    return { group: "ФОТОМЕТРИЯ", ext: fileExtByGroup("ФОТОМЕТРИЯ") };
  }

  getSampleLabel(sampleValue) {
    return SAMPLE_OPTIONS.find((sample) => sample.value === sampleValue)?.label ?? "-";
  }
}
