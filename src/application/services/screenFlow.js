import {
  SCREEN_FLOW_EDGES,
  SCREEN_FLOW_NODES,
  SCREEN_INDEX,
  isKnownScreen,
} from "../../domain/constants/screens.js";

export { SCREEN_FLOW_EDGES, SCREEN_FLOW_NODES, SCREEN_INDEX };

const DEFAULT_WARNING = {
  title: "ПРЕДУПРЕЖДЕНИЕ",
  body: "ПЕРЕХОД ИЗ КАРТЫ СЦЕНАРИЕВ",
};

function shouldValidateTarget() {
  const nodeEnv = globalThis.process?.env?.NODE_ENV;
  if (nodeEnv) return nodeEnv !== "production";
  return import.meta.env?.MODE !== "production";
}

export function transitionToScreen(state, target, overrides = {}) {
  if (shouldValidateTarget() && !isKnownScreen(target)) {
    throw new Error(`Unknown screen target: ${target}`);
  }

  const {
    keepPrevious = false,
    group,
    mode,
    fileContext,
    fileRootIndex,
    fileListIndex,
    fileActionIndex,
    inputTarget,
    inputBuffer,
    dialogTitle,
    returnScreen,
    saveMeta,
    warning,
    warningReturn,
    ...rest
  } = overrides;

  const previousScreen = keepPrevious
    ? (rest.previousScreen ?? state.previousScreen)
    : (rest.previousScreen ?? state.screen ?? state.previousScreen ?? "main");

  const next = {
    ...state,
    ...rest,
    previousScreen,
    screen: target,
  };

  if (target === "fileRoot") {
    return {
      ...next,
      fileRootIndex: typeof fileRootIndex === "number" ? fileRootIndex : state.fileRootIndex ?? 0,
      fileListIndex: 0,
      fileActionIndex: 0,
      fileContext: {
        ...state.fileContext,
        ...(fileContext ?? {}),
        ...(group ? { group } : {}),
        ...(mode ? { mode } : {}),
      },
    };
  }

  if (target === "fileList") {
    return {
      ...next,
      fileRootIndex: typeof fileRootIndex === "number" ? fileRootIndex : state.fileRootIndex ?? 0,
      fileListIndex: typeof fileListIndex === "number" ? fileListIndex : 0,
      fileActionIndex: 0,
      fileContext: {
        ...state.fileContext,
        ...(fileContext ?? {}),
        ...(group ? { group } : {}),
        ...(mode ? { mode } : {}),
      },
    };
  }

  if (target === "fileActionMenu") {
    return {
      ...next,
      fileActionIndex: typeof fileActionIndex === "number" ? fileActionIndex : 0,
      fileContext: {
        ...state.fileContext,
        ...(fileContext ?? {}),
        ...(group ? { group } : {}),
        ...(mode ? { mode } : {}),
      },
    };
  }

  if (target === "input") {
    return {
      ...next,
      inputTarget: inputTarget ?? state.inputTarget ?? "wavelength",
      inputBuffer: inputBuffer ?? state.inputBuffer ?? "",
      dialogTitle: dialogTitle ?? state.dialogTitle ?? "ВВОД ДАННЫХ",
      returnScreen: returnScreen ?? state.screen ?? state.returnScreen ?? "main",
    };
  }

  if (target === "saveDialog") {
    return {
      ...next,
      inputTarget: "saveName",
      inputBuffer: inputBuffer ?? "",
      returnScreen: returnScreen ?? state.screen ?? state.returnScreen ?? "main",
      saveMeta: saveMeta ?? state.saveMeta,
    };
  }

  if (target === "warning") {
    return {
      ...next,
      warning: warning ?? state.warning ?? DEFAULT_WARNING,
      warningReturn: warningReturn ?? state.screen ?? state.warningReturn ?? "main",
    };
  }

  return next;
}
