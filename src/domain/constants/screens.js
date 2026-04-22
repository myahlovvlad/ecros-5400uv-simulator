import screensData from "./screens.json";

const VALID_MODES = new Set(["system", "photometry", "quantitative", "kinetics", "multiWave", "settings", "files", "shared"]);
const VALID_KINDS = new Set(["menu", "input", "measurement", "graph", "dialog", "file", "system"]);
const VALID_IMPLEMENTATION_STATUSES = new Set(["implemented", "partial", "missing", "runtime-only"]);
const VALID_SOURCE_INTEGRITY = new Set(["reindexed", "merged", "ambiguous", "runtime-only"]);

function shouldValidateRegistry() {
  const nodeEnv = globalThis.process?.env?.NODE_ENV;
  if (nodeEnv) return nodeEnv !== "production";
  return import.meta.env?.MODE !== "production";
}

function assertScreenRegistry(screens) {
  const ids = new Set();

  screens.forEach((screen) => {
    if (!screen?.id || typeof screen.id !== "string") {
      throw new Error("Screen registry entry must have a string id");
    }
    if (ids.has(screen.id)) {
      throw new Error(`Duplicate screen id in registry: ${screen.id}`);
    }
    ids.add(screen.id);

    if (!screen.title || typeof screen.title !== "string") {
      throw new Error(`Screen registry entry ${screen.id} must have a title`);
    }
    if (!screen.canonicalId || typeof screen.canonicalId !== "string") {
      throw new Error(`Screen registry entry ${screen.id} must have a canonicalId`);
    }
    if (!VALID_IMPLEMENTATION_STATUSES.has(screen.implementationStatus)) {
      throw new Error(`Screen registry entry ${screen.id} has invalid implementationStatus: ${screen.implementationStatus}`);
    }
    if (!VALID_SOURCE_INTEGRITY.has(screen.sourceIntegrity)) {
      throw new Error(`Screen registry entry ${screen.id} has invalid sourceIntegrity: ${screen.sourceIntegrity}`);
    }
    if (!VALID_MODES.has(screen.mode)) {
      throw new Error(`Screen registry entry ${screen.id} has invalid mode: ${screen.mode}`);
    }
    if (!VALID_KINDS.has(screen.kind)) {
      throw new Error(`Screen registry entry ${screen.id} has invalid kind: ${screen.kind}`);
    }
    if (!Array.isArray(screen.transitions)) {
      throw new Error(`Screen registry entry ${screen.id} must have transitions[]`);
    }
  });

  screens.forEach((screen) => {
    screen.transitions.forEach((transition) => {
      if (!transition?.action || typeof transition.action !== "string") {
        throw new Error(`Screen ${screen.id} has transition without action`);
      }
      if (!ids.has(transition.target)) {
        throw new Error(`Screen ${screen.id} transition "${transition.action}" targets unknown screen: ${transition.target}`);
      }
    });
  });
}

if (shouldValidateRegistry()) {
  assertScreenRegistry(screensData);
}

export const SCREEN_REGISTRY = Object.freeze(
  Object.fromEntries(screensData.map((screen) => [screen.id, Object.freeze(screen)])),
);

export const SCREEN_INDEX = Object.freeze(
  Object.fromEntries(screensData.map((screen) => [screen.id, screen.legacyWnd])),
);

export const SCREEN_CANONICAL_INDEX = Object.freeze(
  Object.fromEntries(screensData.map((screen) => [screen.id, screen.canonicalId])),
);

export const SCREEN_FLOW_NODES = Object.freeze(
  screensData
    .filter((screen) => screen.flowPosition)
    .map((screen) => Object.freeze({
      id: screen.id,
      label: screen.label ?? screen.title,
      x: screen.flowPosition.x,
      y: screen.flowPosition.y,
    })),
);

export const SCREEN_FLOW_EDGES = Object.freeze(
  screensData.flatMap((screen) =>
    screen.transitions.map((transition) => Object.freeze([
      screen.id,
      transition.target,
      transition.action,
    ])),
  ),
);

export function getScreenMeta(id) {
  return SCREEN_REGISTRY[id] ?? null;
}

export function getScreenTransitions(id) {
  return getScreenMeta(id)?.transitions ?? [];
}

export function isKnownScreen(id) {
  return Boolean(SCREEN_REGISTRY[id]);
}

export function validateScreenRegistryForTests() {
  assertScreenRegistry(screensData);
  return true;
}
