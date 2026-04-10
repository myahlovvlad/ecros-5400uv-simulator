const DEBUG_FLAG = "__ECROS_DEBUG__";

function isDevEnvironment() {
  try {
    return Boolean(import.meta.env?.DEV);
  } catch {
    return false;
  }
}

export function isDebugEnabled() {
  if (!isDevEnvironment()) return false;
  return Boolean(globalThis?.[DEBUG_FLAG]);
}

export function enableDebugLogs() {
  if (!isDevEnvironment()) return;
  globalThis[DEBUG_FLAG] = true;
}

export function disableDebugLogs() {
  if (!isDevEnvironment()) return;
  globalThis[DEBUG_FLAG] = false;
}

export function debugLog(scope, ...args) {
  if (!isDebugEnabled()) return;
  console.debug(`[${scope}]`, ...args);
}

export function debugError(scope, error, details = null) {
  if (!isDevEnvironment()) return;
  if (details == null) {
    console.error(`[${scope}]`, error);
    return;
  }
  console.error(`[${scope}]`, error, details);
}

export { DEBUG_FLAG };
