import {
  addNoise,
  buildUsbExportPreview,
  fileExtByGroup,
  findNextPendingStep,
  measureMultiwaveSeries,
  measureSample,
  referenceEnergyAt,
  validateFileName,
  validateMultiwaveCount,
  validateMultiwaveWavelength,
  validateNumeric,
  validateQuantCuvetteLengthMm,
  validateWavelength,
} from "../../domain/usecases/index.js";
import { DARK_VALUES, SAMPLE_OPTIONS } from "../../domain/constants/index.js";
import { StateBus } from "./StateBus.js";

function normalizeMultiwaveWavelengths(wavelengths = []) {
  const normalized = Array.from({ length: 4 }, (_, index) => wavelengths[index] ?? null);
  return normalized;
}

function buildFileDataFromState(state, group) {
  if (group === "ФОТОМЕТРИЯ") {
    return {
      measurements: [...(state.measurements ?? [])],
      measurementCursor: state.measurementCursor,
      wavelength: state.wavelength,
      photometryValueIndex: state.photometryValueIndex,
      lastEnergy: state.lastEnergy,
      lastComputedA: state.lastComputedA,
      lastComputedT: state.lastComputedT,
    };
  }

  if (group === "ГРАДУИРОВКА") {
    const plan = state.calibration?.plan ?? [];
    return {
      calibration: {
        ...state.calibration,
        plan: plan.map((step) => ({ ...step, result: step.result ? { ...step.result } : null })),
      },
      wavelength: state.wavelength,
      lastEnergy: state.lastEnergy,
      lastComputedA: state.lastComputedA,
      lastComputedT: state.lastComputedT,
    };
  }

  if (group === "КОЭФФИЦИЕНТ") {
    return {
      wavelength: state.wavelength,
      quantK: state.quantK,
      quantB: state.quantB,
      lastA: state.lastComputedA,
      lastEnergy: state.lastEnergy,
      lastComputedT: state.lastComputedT,
      cuvetteLengthMm: state.cuvetteLengthMm ?? 10,
      unitsIndex: state.unitsIndex,
    };
  }

  if (group === "КИНЕТИКА") {
    return {
      kineticPoints: (state.kineticPoints ?? []).map((point) => ({ ...point })),
      wavelength: state.wavelength,
      kineticUpper: state.kineticUpper,
      kineticLower: state.kineticLower,
      kineticDuration: state.kineticDuration,
      lastEnergy: state.lastEnergy,
      lastComputedA: state.lastComputedA,
      lastComputedT: state.lastComputedT,
    };
  }

  if (group === "МНОГОВОЛНОВЫЙ") {
    const results = state.multiwave?.results ?? [];
    return {
      multiwave: {
        waveCount: state.multiwave?.waveCount ?? 2,
        wavelengths: normalizeMultiwaveWavelengths(state.multiwave?.wavelengths),
        valueIndex: state.multiwave?.valueIndex ?? 0,
        results: results.map((item) => ({ ...item })),
        editIndex: state.multiwave?.editIndex ?? 0,
      },
      lastEnergy: state.lastEnergy,
      lastComputedA: state.lastComputedA,
      lastComputedT: state.lastComputedT,
    };
  }

  return {};
}

function buildExportContext(state, group, selected) {
  const payload = selected?.data ?? buildFileDataFromState(state, group);
  const calibrationPlan = payload.calibration?.plan ?? state.calibration.plan;
  const multiwave = payload.multiwave ?? state.multiwave;

  return {
    group,
    name: selected?.name ?? "EXPORT",
    ext: selected?.ext ?? fileExtByGroup(group),
    measurements: payload.measurements ?? state.measurements,
    calibrationPlan,
    kineticPoints: payload.kineticPoints ?? state.kineticPoints,
    multiwaveResults: multiwave?.results ?? state.multiwave.results,
    wavelength: payload.wavelength ?? state.wavelength,
    quantK: payload.quantK ?? state.quantK,
    quantB: payload.quantB ?? state.quantB,
    lastA: payload.lastA ?? payload.lastComputedA ?? state.lastComputedA,
    cuvetteLengthMm: payload.cuvetteLengthMm ?? state.cuvetteLengthMm ?? 10,
  };
}

function buildOpenState(state, group, payload) {
  if (group === "ФОТОМЕТРИЯ") {
    return {
      ...state,
      measurements: payload.measurements ?? [],
      measurementCursor: payload.measurementCursor ?? 0,
      wavelength: payload.wavelength ?? state.wavelength,
      photometryValueIndex: payload.photometryValueIndex ?? state.photometryValueIndex,
      lastEnergy: payload.lastEnergy ?? state.lastEnergy,
      lastComputedA: payload.lastComputedA ?? state.lastComputedA,
      lastComputedT: payload.lastComputedT ?? state.lastComputedT,
      screen: "photometry",
    };
  }

  if (group === "ГРАДУИРОВКА") {
    return {
      ...state,
      calibration: payload.calibration ?? state.calibration,
      wavelength: payload.wavelength ?? state.wavelength,
      lastEnergy: payload.lastEnergy ?? state.lastEnergy,
      lastComputedA: payload.lastComputedA ?? state.lastComputedA,
      lastComputedT: payload.lastComputedT ?? state.lastComputedT,
      screen: "calibrationJournal",
    };
  }

  if (group === "КОЭФФИЦИЕНТ") {
    return {
      ...state,
      wavelength: payload.wavelength ?? state.wavelength,
      quantK: payload.quantK ?? state.quantK,
      quantB: payload.quantB ?? state.quantB,
      cuvetteLengthMm: payload.cuvetteLengthMm ?? state.cuvetteLengthMm ?? 10,
      lastEnergy: payload.lastEnergy ?? state.lastEnergy,
      lastComputedA: payload.lastA ?? payload.lastComputedA ?? state.lastComputedA,
      lastComputedT: payload.lastComputedT ?? state.lastComputedT,
      screen: "quantCoef",
    };
  }

  if (group === "КИНЕТИКА") {
    return {
      ...state,
      kineticPoints: payload.kineticPoints ?? [],
      wavelength: payload.wavelength ?? state.wavelength,
      kineticUpper: payload.kineticUpper ?? state.kineticUpper,
      kineticLower: payload.kineticLower ?? state.kineticLower,
      kineticDuration: payload.kineticDuration ?? state.kineticDuration,
      lastEnergy: payload.lastEnergy ?? state.lastEnergy,
      lastComputedA: payload.lastComputedA ?? state.lastComputedA,
      lastComputedT: payload.lastComputedT ?? state.lastComputedT,
      screen: "kineticsMenu",
    };
  }

  if (group === "МНОГОВОЛНОВЫЙ") {
    const multiwave = payload.multiwave ?? state.multiwave;
    return {
      ...state,
      multiwave: {
        ...state.multiwave,
        ...multiwave,
        wavelengths: normalizeMultiwaveWavelengths(multiwave.wavelengths),
      },
      lastEnergy: payload.lastEnergy ?? state.lastEnergy,
      lastComputedA: payload.lastComputedA ?? state.lastComputedA,
      lastComputedT: payload.lastComputedT ?? state.lastComputedT,
      screen: (multiwave.results?.length ?? 0) > 0 ? "multiwaveResults" : "multiwaveMenu",
    };
  }

  return state;
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

  performMultiwaveMeasure(state) {
    const countValidation = validateMultiwaveCount(state.multiwave.waveCount);
    if (!countValidation.valid) {
      return {
        newState: state,
        error: { title: "ОШИБКА", body: countValidation.error, returnScreen: "multiwaveMenu" },
      };
    }

    const wavelengths = normalizeMultiwaveWavelengths(state.multiwave.wavelengths);
    for (let slot = 0; slot < countValidation.value; slot += 1) {
      const validation = validateMultiwaveWavelength(wavelengths[slot]);
      if (!validation.valid) {
        return {
          newState: state,
          error: {
            title: "ОШИБКА",
            body: `λ${slot + 1}: ${validation.error}`,
            returnScreen: "multiwaveWaveEntry",
          },
        };
      }
      wavelengths[slot] = validation.value;
    }

    const series = measureMultiwaveSeries({
      ...state,
      multiwave: {
        ...state.multiwave,
        waveCount: countValidation.value,
        wavelengths,
      },
    });
    const lastMeasurement = series.at(-1);

    return {
      newState: {
        ...state,
        lastEnergy: lastMeasurement?.energy ?? state.lastEnergy,
        lastComputedA: lastMeasurement?.a ?? state.lastComputedA,
        lastComputedT: lastMeasurement?.t ?? state.lastComputedT,
        multiwave: {
          ...state.multiwave,
          waveCount: countValidation.value,
          wavelengths,
          results: series,
        },
      },
      logEntry: `multiwave -> ${series.map((item) => item.wavelength.toFixed(1)).join(",")}`,
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

  openFile(state, group, index) {
    const files = [...(state.files[group] || [])];
    const selected = files[index];

    if (!selected?.data) {
      return {
        newState: state,
        error: { title: "ОТКРЫТИЕ", body: "ДАННЫЕ ФАЙЛА НЕДОСТУПНЫ", returnScreen: "fileList" },
      };
    }

    return {
      newState: buildOpenState(state, group, selected.data),
      logEntry: `open -> ${selected.name}${selected.ext}`,
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
      content: buildUsbExportPreview(buildExportContext(state, group, selected)),
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
    const context = this.getSaveContext(state);
    const group = context.group;
    const ext = context.ext;
    const items = [...(state.files[group] || [])];

    if (items.some((file) => file.name === normalizedName)) {
      return {
        newState: state,
        error: { title: "ИМЯ УЖЕ ЕСТЬ", body: "НУЖНО ДРУГОЕ ИМЯ", returnScreen: "saveDialog" },
      };
    }

    items.push({
      name: normalizedName,
      ext,
      exported: false,
      data: context.data,
      savedAt: new Date().toISOString(),
    });

    return {
      newState: {
        ...state,
        files: { ...state.files, [group]: items },
        saveMeta: { group, suggestedExt: ext },
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

    StateBus.emit("wavelength:changed", validation.value);

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

  setMultiwaveCount(state, value) {
    const validation = validateMultiwaveCount(value);
    if (!validation.valid) {
      return {
        newState: state,
        error: { title: "ОШИБКА", body: validation.error, returnScreen: state.returnScreen || "multiwaveMenu" },
      };
    }

    return {
      newState: {
        ...state,
        multiwave: {
          ...state.multiwave,
          waveCount: validation.value,
          editIndex: Math.min(state.multiwave.editIndex, validation.value - 1),
        },
        inputBuffer: "",
        inputTarget: null,
        screen: state.returnScreen || "multiwaveMenu",
      },
      logEntry: `multiwave-count -> ${validation.value}`,
    };
  }

  setMultiwaveWavelength(state, slot, value) {
    const validation = validateMultiwaveWavelength(value);
    if (!validation.valid) {
      return {
        newState: state,
        error: { title: "ОШИБКА", body: validation.error, returnScreen: state.returnScreen || "multiwaveWaveEntry" },
      };
    }

    const wavelengths = normalizeMultiwaveWavelengths(state.multiwave.wavelengths);
    wavelengths[slot] = validation.value;

    return {
      newState: {
        ...state,
        multiwave: {
          ...state.multiwave,
          wavelengths,
          editIndex: slot,
        },
        inputBuffer: "",
        inputTarget: null,
        screen: state.returnScreen || "multiwaveWaveEntry",
      },
      logEntry: `multiwave-wl${slot + 1} -> ${validation.value.toFixed(1)}`,
    };
  }

  setMultiwaveValueMode(state, valueIndex) {
    const nextValueIndex = Math.max(0, Math.min(2, valueIndex));
    return {
      newState: {
        ...state,
        multiwave: {
          ...state.multiwave,
          valueIndex: nextValueIndex,
        },
      },
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

  setQuantCuvetteLengthMm(state, value) {
    const validation = validateQuantCuvetteLengthMm(value);
    if (!validation.valid) {
      return {
        newState: state,
        error: { title: "ОШИБКА", body: validation.error, returnScreen: "quantMain" },
      };
    }

    return {
      newState: {
        ...state,
        cuvetteLengthMm: validation.value,
        inputBuffer: "",
        inputTarget: null,
        screen: state.returnScreen || "quantMain",
      },
      logEntry: `quant-cuvette-mm -> ${validation.value.toFixed(1)}`,
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
    if (["multiwaveMenu", "multiwaveWaveCount", "multiwaveWaveEntry", "multiwaveValue", "multiwaveResults"].includes(state.screen)) {
      return {
        group: "МНОГОВОЛНОВЫЙ",
        ext: fileExtByGroup("МНОГОВОЛНОВЫЙ"),
        data: buildFileDataFromState(state, "МНОГОВОЛНОВЫЙ"),
      };
    }

    if (state.screen === "quantCoef") {
      return {
        group: "КОЭФФИЦИЕНТ",
        ext: fileExtByGroup("КОЭФФИЦИЕНТ"),
        data: buildFileDataFromState(state, "КОЭФФИЦИЕНТ"),
      };
    }

    if (["kineticsRun", "kineticsGraph", "kineticsMenu"].includes(state.screen)) {
      return {
        group: "КИНЕТИКА",
        ext: fileExtByGroup("КИНЕТИКА"),
        data: buildFileDataFromState(state, "КИНЕТИКА"),
      };
    }

    if (["calibrationStep", "calibrationJournal", "calibrationGraph", "calibrationPlan"].includes(state.screen)) {
      return {
        group: "ГРАДУИРОВКА",
        ext: fileExtByGroup("ГРАДУИРОВКА"),
        data: buildFileDataFromState(state, "ГРАДУИРОВКА"),
      };
    }

    return {
      group: "ФОТОМЕТРИЯ",
      ext: fileExtByGroup("ФОТОМЕТРИЯ"),
      data: buildFileDataFromState(state, "ФОТОМЕТРИЯ"),
    };
  }

  getSampleLabel(sampleValue) {
    return SAMPLE_OPTIONS.find((sample) => sample.value === sampleValue)?.label ?? "-";
  }
}
