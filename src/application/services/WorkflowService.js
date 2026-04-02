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

  buildCurveEquation(device) {
    const points = (device.calibration?.aggregatedStandards ?? []).filter((point) => Number.isFinite(point?.x) && Number.isFinite(point?.y));
    if (points.length < 2) {
      return {
        ...device,
        calibration: {
          ...device.calibration,
          equation: null,
        },
      };
    }

    const forceZero = device.calibration?.modelType === "ZERO_INTERCEPT";
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
      ...device,
      calibration: {
        ...device.calibration,
        equation: { slope, intercept, forceZero },
      },
    };
  }

  calculateCurveConcentration(device, signalValue) {
    const equation = device.calibration?.equation;
    if (!equation || Math.abs(equation.slope) < 1e-9) return null;
    return (signalValue - equation.intercept) / equation.slope;
  }

  calculateCoefConcentration(device, signalValue) {
    const base = device.quantK * signalValue + device.quantB;
    const factor = device.quantCoefContext?.correctionFactors?.conversionFactor ?? 1;
    const dilution = device.quantCoefContext?.correctionFactors?.dilution ?? 1;
    return base * factor * dilution;
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
