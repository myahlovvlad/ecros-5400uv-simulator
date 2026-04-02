export const MODES = {
  PHOTO: "PHOTO",
  QUANT_CURVE: "QUANT_CURVE",
  QUANT_COEF: "QUANT_COEF",
  KINETIC: "KINETIC",
  MULTIWL: "MULTIWL",
  SETTINGS: "SETTINGS",
};

export const TASK_STATES = {
  IDLE: "IDLE",
  EDITING: "EDITING",
  READY: "READY",
  ZERO_REQUIRED: "ZERO_REQUIRED",
  ZERO_RUNNING: "ZERO_RUNNING",
  RUNNING: "RUNNING",
  PAUSED: "PAUSED",
  WAIT_NEXT_SAMPLE: "WAIT_NEXT_SAMPLE",
  COMPLETED: "COMPLETED",
  ERROR: "ERROR",
};

export const ZERO_STATES = {
  VALID: "VALID",
  INVALID: "INVALID",
  REQUIRED: "REQUIRED",
  RUNNING: "RUNNING",
};

export const SIGNAL_TYPES = {
  A: "A",
  T: "%T",
  E: "E",
};

export const MULTIWL_FORMULA_MODES = {
  RAW: "RAW",
  DIFF: "DIFF",
  RATIO: "RATIO",
};

export function makeZeroSignature(device = {}) {
  return {
    wavelength: device.wavelength ?? 546.2,
    signalType: device.photometryValueIndex ?? 0,
    gain: device.gain ?? 1,
    mode: device.mode ?? MODES.PHOTO,
    methodHash: device.methodHash ?? null,
  };
}
