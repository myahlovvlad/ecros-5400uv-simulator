/**
 * LocalStorage - реализация StoragePort для браузера
 */

import { StoragePort } from '../../application/ports/index.js';

export class LocalStorageAdapter extends StoragePort {
  constructor(prefix = 'ecros_5400uv_') {
    super();
    this.prefix = prefix;
  }

  _makeKey(key) {
    return `${this.prefix}${key}`;
  }

  save(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(this._makeKey(key), serialized);
    } catch (error) {
      console.error('LocalStorage save error:', error);
    }
  }

  load(key) {
    try {
      const serialized = localStorage.getItem(this._makeKey(key));
      if (serialized === null) return undefined;
      return JSON.parse(serialized);
    } catch (error) {
      console.error('LocalStorage load error:', error);
      return undefined;
    }
  }

  delete(key) {
    localStorage.removeItem(this._makeKey(key));
  }

  has(key) {
    return localStorage.getItem(this._makeKey(key)) !== null;
  }

  clear() {
    const keys = Object.keys(localStorage);
    keys
      .filter((key) => key.startsWith(this.prefix))
      .forEach((key) => localStorage.removeItem(key));
  }
}
