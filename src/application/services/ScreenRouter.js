import { SCREEN_ACTION_MATRIX, SCREEN_HANDLER_MAP } from "./ActionMatrix.js";

export function routeScreenAction(state, action, actions) {
  const matrix = SCREEN_ACTION_MATRIX[state.screen];
  if (matrix) {
    const handler = matrix[action] ?? matrix["*"];
    if (handler) return handler(state, actions, action);
  }

  const screenHandler = SCREEN_HANDLER_MAP[state.screen];
  if (screenHandler) {
    return screenHandler(state, action, actions);
  }

  return undefined;
}
