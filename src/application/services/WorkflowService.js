import { MULTIWL_FORMULAS } from "../../domain/constants/index.js";
import { measureSample } from "../../domain/usecases/index.js";
import { MODES, TASK_STATES, ZERO_STATES, makeZeroSignature } from "../../domain/entities/workflowTypes.js";

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function stddev(values) {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((acc, value) => acc + (value - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export class WorkflowService {
  invalidateZero(device, reason = "CONFIG") {
    return {
      ...device,
      zeroState: ZERO_STATES.REQUIRED,
      taskState: TASK_STATES.ZERO_REQUIRED,
      zeroInvalidationReason: reason,
    };
  }

  completeZero(device) {
    return {
      ...device,
      zeroState: ZERO_STATES.VALID,
      taskState: TASK_STATES.READY,
      zeroSignature: makeZeroSignature(device),
    };
  }

  setMode(device, mode) {
    return {
      ...device,
      mode,
      taskState: device.zeroState === ZERO_STATES.VALID ? TASK_STATES.READY : TASK_STATES.ZERO_REQUIRED,
    };
  }

  startPhotoSeries(device) {
    return {
      ...device,
      mode: MODES.PHOTO,
      taskState: TASK_STATES.RUNNING,
      photoSeries: {
        seriesNo: device.photoSeries?.seriesNo ?? 1,
        replicateNo: 0,
        replicatesRequired: device.photoReplicates ?? 1,
      },
    };
  }

  appendPhotoReplicate(device, measurement) {
    const photoSeries = {
      ...(device.photoSeries ?? { seriesNo: 1, replicateNo: 0, replicatesRequired: 1 }),
      replicateNo: (device.photoSeries?.replicateNo ?? 0) + 1,
    };
    const nextMeasurements = [
      ...(device.measurements ?? []),
      {
        index: `${photoSeries.seriesNo}-${photoSeries.replicateNo}`,
        wavelength: device.wavelength,
        ...measurement,
      },
    ].slice(-150);

    const replicateValues = nextMeasurements
      .filter((item) => String(item.index).startsWith(`${photoSeries.seriesNo}-`))
      .map((item) => item.a);

    return {
      ...device,
      mode: MODES.PHOTO,
      taskState:
        photoSeries.replicateNo >= photoSeries.replicatesRequired ? TASK_STATES.WAIT_NEXT_SAMPLE : TASK_STATES.RUNNING,
      measurements: nextMeasurements,
      measurementCursor: nextMeasurements.length ? nextMeasurements.length - 1 : 0,
      photoSeries,
      photoStats: {
        mean: mean(replicateValues),
        sd: stddev(replicateValues),
      },
    };
  }

  nextPhotoSample(device) {
    return {
      ...device,
      taskState: TASK_STATES.READY,
      photoSeries: {
        ...(device.photoSeries ?? { replicatesRequired: 1 }),
        seriesNo: (device.photoSeries?.seriesNo ?? 1) + 1,
        replicateNo: 0,
      },
    };
  }

  setStandardConcentration(device, standardIndex, concentration) {
    const standardConcentrations = [...(device.calibration?.standardConcentrations ?? [])];
    standardConcentrations[standardIndex - 1] = concentration;
    return {
      ...device,
      calibration: {
        ...device.calibration,
        standardConcentrations,
      },
    };
  }

  aggregateCalibrationStandards(device) {
    const grouped = new Map();
    for (const step of device.calibration?.plan ?? []) {
      if (!step?.result) continue;
      const key = step.standardIndex;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(step.result);
    }

    const aggregatedStandards = Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([standardIndex, results]) => {
        const concentration = device.calibration?.standardConcentrations?.[standardIndex - 1] ?? standardIndex;
        const aValues = results.map((item) => item.a);
        const tValues = results.map((item) => item.t);
        const eValues = results.map((item) => item.energy);
        return {
          standardIndex,
          concentration,
          x: concentration,
          y: mean(aValues),
          meanA: mean(aValues),
          meanT: mean(tValues),
          meanE: mean(eValues),
          sdA: stddev(aValues),
          replicates: results.length,
        };
      });

    return {
      ...device,
      calibration: {
        ...device.calibration,
        aggregatedStandards,
      },
    };
  }

  buildCurveEquation(device) {
    const aggregatedDevice = this.aggregateCalibrationStandards(device);
    const points = (aggregatedDevice.calibration?.aggregatedStandards ?? []).filter((point) => Number.isFinite(point?.x) && Number.isFinite(point?.y));
    if (points.length < 2) {
      return {
        ...aggregatedDevice,
        calibration: {
          ...aggregatedDevice.calibration,
          equation: null,
        },
      };
    }

    const forceZero = aggregatedDevice.calibration?.modelType === "ZERO_INTERCEPT";
    let slope = 0;
    let intercept = 0;

    if (forceZero) {
      const numerator = points.reduce((acc, point) => acc + point.x * point.y, 0);
      const denominator = points.reduce((acc, point) => acc + point.x * point.x, 0) || 1;
      slope = numerator / denominator;
    } else {
      const avgX = mean(points.map((point) => point.x));
      const avgY = mean(points.map((point) => point.y));
      const numerator = points.reduce((acc, point) => acc + (point.x - avgX) * (point.y - avgY), 0);
      const denominator = points.reduce((acc, point) => acc + (point.x - avgX) ** 2, 0) || 1;
      slope = numerator / denominator;
      intercept = avgY - slope * avgX;
    }

    return {
      ...aggregatedDevice,
      calibration: {
        ...aggregatedDevice.calibration,
        equation: { slope, intercept, forceZero },
      },
    };
  }

  calculateCurveConcentration(device, signalValue) {
    const equation = device.calibration?.equation;
    if (!equation || Math.abs(equation.slope) < 1e-9) return null;
    return (signalValue - equation.intercept) / equation.slope;
  }

  startUnknownSampleSeries(device) {
    return {
      ...device,
      taskState: TASK_STATES.RUNNING,
      calibration: {
        ...device.calibration,
        currentUnknownReplicate: 0,
        currentUnknownReplicates: [],
      },
    };
  }

  appendCalibrationUnknownReplicate(device, measurement) {
    const currentUnknownReplicate = (device.calibration?.currentUnknownReplicate ?? 0) + 1;
    const concentration = this.calculateCurveConcentration(device, measurement.a);
    const entry = {
      sampleNo: device.calibration?.currentUnknownNo ?? 1,
      replicateNo: currentUnknownReplicate,
      concentration,
      measurement,
      index: `${device.calibration?.currentUnknownNo ?? 1}-${currentUnknownReplicate}`,
    };
    const currentUnknownReplicates = [...(device.calibration?.currentUnknownReplicates ?? []), entry];
    const unknownReplicatesRequired = device.calibration?.unknownReplicates ?? 1;

    let calibration = {
      ...device.calibration,
      currentUnknownReplicate,
      currentUnknownReplicates,
    };
    let taskState = TASK_STATES.RUNNING;

    if (currentUnknownReplicate >= unknownReplicatesRequired) {
      const concentrations = currentUnknownReplicates.map((item) => item.concentration).filter((value) => Number.isFinite(value));
      calibration = {
        ...calibration,
        unknownResults: [
          ...(device.calibration?.unknownResults ?? []),
          {
            sampleNo: device.calibration?.currentUnknownNo ?? 1,
            replicates: currentUnknownReplicates,
            meanConcentration: mean(concentrations),
            sdConcentration: stddev(concentrations),
          },
        ],
      };
      taskState = TASK_STATES.WAIT_NEXT_SAMPLE;
    }

    return {
      ...device,
      taskState,
      calibration,
      lastEnergy: measurement.energy,
      lastComputedA: measurement.a,
      lastComputedT: measurement.t,
    };
  }

  nextUnknownSample(device) {
    return {
      ...device,
      taskState: TASK_STATES.READY,
      calibration: {
        ...device.calibration,
        currentUnknownNo: (device.calibration?.currentUnknownNo ?? 1) + 1,
        currentUnknownReplicate: 0,
        currentUnknownReplicates: [],
      },
    };
  }

  calculateCoefConcentration(device, signalValue) {
    const base = device.quantK * signalValue + device.quantB;
    const factor = device.quantCoefContext?.correctionFactors?.conversionFactor ?? 1;
    const dilution = device.quantCoefContext?.correctionFactors?.dilution ?? 1;
    return base * factor * dilution;
  }

  startCoefSampleSeries(device) {
    return {
      ...device,
      mode: MODES.QUANT_COEF,
      taskState: TASK_STATES.RUNNING,
      quantCoefContext: {
        ...device.quantCoefContext,
        currentUnknownReplicate: 0,
        currentUnknownReplicates: [],
        paused: false,
      },
    };
  }

  appendCoefReplicate(device, measurement) {
    const currentUnknownReplicate = (device.quantCoefContext?.currentUnknownReplicate ?? 0) + 1;
    const concentration = this.calculateCoefConcentration(device, measurement.a);
    const entry = {
      sampleNo: device.quantCoefContext?.currentUnknownNo ?? 1,
      replicateNo: currentUnknownReplicate,
      concentration,
      measurement,
      index: `${device.quantCoefContext?.currentUnknownNo ?? 1}-${currentUnknownReplicate}`,
    };
    const currentUnknownReplicates = [...(device.quantCoefContext?.currentUnknownReplicates ?? []), entry];
    const unknownReplicatesRequired = device.quantCoefContext?.unknownReplicates ?? 1;

    let quantCoefContext = {
      ...device.quantCoefContext,
      currentUnknownReplicate,
      currentUnknownReplicates,
      paused: false,
    };
    let taskState = TASK_STATES.RUNNING;

    if (currentUnknownReplicate >= unknownReplicatesRequired) {
      const concentrations = currentUnknownReplicates.map((item) => item.concentration).filter((value) => Number.isFinite(value));
      quantCoefContext = {
        ...quantCoefContext,
        results: [
          ...(device.quantCoefContext?.results ?? []),
          {
            sampleNo: device.quantCoefContext?.currentUnknownNo ?? 1,
            replicates: currentUnknownReplicates,
            meanConcentration: mean(concentrations),
            sdConcentration: stddev(concentrations),
          },
        ],
      };
      taskState = TASK_STATES.WAIT_NEXT_SAMPLE;
    }

    return {
      ...device,
      taskState,
      quantCoefContext,
      lastEnergy: measurement.energy,
      lastComputedA: measurement.a,
      lastComputedT: measurement.t,
    };
  }

  nextCoefSample(device) {
    return {
      ...device,
      taskState: TASK_STATES.READY,
      quantCoefContext: {
        ...device.quantCoefContext,
        currentUnknownNo: (device.quantCoefContext?.currentUnknownNo ?? 1) + 1,
        currentUnknownReplicate: 0,
        currentUnknownReplicates: [],
        paused: false,
      },
    };
  }

  toggleCoefPause(device) {
    const paused = !device.quantCoefContext?.paused;
    return {
      ...device,
      taskState: paused ? TASK_STATES.PAUSED : TASK_STATES.RUNNING,
      quantCoefContext: {
        ...device.quantCoefContext,
        paused,
      },
    };
  }

  startMultiWl(device) {
    return {
      ...device,
      mode: MODES.MULTIWL,
      taskState: TASK_STATES.RUNNING,
      multiwl: {
        ...device.multiwl,
        paused: false,
      },
    };
  }

  toggleMultiWlPause(device) {
    const paused = !device.multiwl?.paused;
    return {
      ...device,
      taskState: paused ? TASK_STATES.PAUSED : TASK_STATES.RUNNING,
      multiwl: {
        ...device.multiwl,
        paused,
      },
    };
  }

  runMultiWlMeasurement(device) {
    const values = (device.multiwl?.wavelengths ?? []).map((wavelength) =>
      measureSample({
        sample: device.currentSample,
        wavelength,
        gain: device.gain,
        e100: device.e100,
        darkValues: device.darkValues,
      }),
    );

    let computed = values.map((item) => item.a);
    const formula = device.multiwl?.formula ?? MULTIWL_FORMULAS[0];
    if (formula === "DIFF" && values.length >= 2) computed = [values[0].a - values[1].a];
    if (formula === "RATIO" && values.length >= 2) computed = [values[1].a === 0 ? 0 : values[0].a / values[1].a];

    return {
      ...device,
      taskState: TASK_STATES.COMPLETED,
      multiwlResults: [
        ...(device.multiwlResults ?? []),
        {
          wavelengths: [...(device.multiwl?.wavelengths ?? [])],
          formula,
          values,
          computed,
        },
      ].slice(-50),
      lastComputedA: values[0]?.a ?? device.lastComputedA,
      lastComputedT: values[0]?.t ?? device.lastComputedT,
      lastEnergy: values[0]?.energy ?? device.lastEnergy,
    };
  }

  setStatisticsMode(device, statisticsMode) {
    return {
      ...device,
      statisticsMode,
    };
  }
}
