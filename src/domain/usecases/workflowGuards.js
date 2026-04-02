import { GAIN_MAX, GAIN_MIN, WL_MAX, WL_MIN } from "../constants/index.js";
import { TASK_STATES, ZERO_STATES } from "../entities/workflowTypes.js";

export function isWavelengthValid(device) {
  const wl = Number(device?.wavelength);
  return Number.isFinite(wl) && wl >= WL_MIN && wl <= WL_MAX;
}

export function isZeroValid(device) {
  return device?.zeroState === ZERO_STATES.VALID;
}

export function isGainValidForEnergy(device) {
  const gain = Number(device?.gain);
  return Number.isInteger(gain) && gain >= GAIN_MIN && gain <= GAIN_MAX;
}

export function hasResults(device) {
  return (
    (device?.measurements?.length ?? 0) > 0 ||
    (device?.calibration?.plan?.some((step) => step?.result) ?? false) ||
    (device?.kineticPoints?.length ?? 0) > 0 ||
    (device?.multiwlResults?.length ?? 0) > 0
  );
}

export function hasIncompleteSeries(device) {
  return [TASK_STATES.RUNNING, TASK_STATES.PAUSED, TASK_STATES.WAIT_NEXT_SAMPLE].includes(device?.taskState);
}

export function isCurveMethodValid(device) {
  const calibration = device?.calibration;
  return (
    isWavelengthValid(device) &&
    calibration &&
    calibration.standards >= 1 &&
    calibration.standards <= 9 &&
    calibration.parallels >= 1 &&
    calibration.parallels <= 9 &&
    calibration.unknownReplicates >= 1 &&
    calibration.unknownReplicates <= 9
  );
}

export function isCoefMethodValid(device) {
  return isWavelengthValid(device) && Number.isFinite(device?.quantK) && Number.isFinite(device?.quantB);
}

export function isCalibrationReady(device) {
  return Boolean(device?.calibration?.equation);
}

export function isStandardConcentrationValid(value) {
  const parsed = typeof value === "string" ? Number.parseFloat(value) : value;
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 999999;
}

export function canPauseCurrentMode(device) {
  return device?.mode === "QUANT_COEF" || device?.mode === "MULTIWL";
}

export function canSaveCurrentContext(device) {
  return hasResults(device);
}

export function isMultiWlConfigValid(device) {
  const wavelengths = device?.multiwl?.wavelengths ?? [];
  return wavelengths.length >= 1 && wavelengths.length <= 4 && wavelengths.every((wl) => wl >= WL_MIN && wl <= WL_MAX);
}

export function isKineticMethodValid(device) {
  return (
    isWavelengthValid(device) &&
    Number.isFinite(device?.kineticDuration) &&
    device.kineticDuration >= 10 &&
    device.kineticDuration <= 1200
  );
}
