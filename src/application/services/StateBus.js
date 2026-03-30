/**
 * Minimal event bus for lightweight cross-module synchronization.
 *
 * Event schema:
 * - `wavelength:changed` -> `number` in nm
 * - `labels:changed` -> `Record<string, string>`
 */
export const StateBus = {
  _listeners: {},
  on(event, fn) {
    (this._listeners[event] ??= []).push(fn);
    return () => {
      this._listeners[event] = (this._listeners[event] ?? []).filter((listener) => listener !== fn);
    };
  },
  emit(event, data) {
    (this._listeners[event] ?? []).forEach((fn) => fn(data));
  },
};
