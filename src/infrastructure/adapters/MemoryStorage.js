/**
 * Хранилище в памяти - реализация StoragePort для тестов
 */

import { StoragePort } from '../../application/ports/index.js';

export class MemoryStorage extends StoragePort {
  constructor() {
    super();
    this.store = new Map();
  }

  save(key, value) {
    this.store.set(key, value);
  }

  load(key) {
    return this.store.get(key);
  }

  delete(key) {
    return this.store.delete(key);
  }

  has(key) {
    return this.store.has(key);
  }

  clear() {
    this.store.clear();
  }

  keys() {
    return Array.from(this.store.keys());
  }
}
