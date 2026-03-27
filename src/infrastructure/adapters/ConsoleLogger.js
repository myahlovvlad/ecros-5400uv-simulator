/**
 * Консольный логгер - реализация LoggerPort
 */

import { LoggerPort } from '../../application/ports/index.js';

export class ConsoleLogger extends LoggerPort {
  constructor(options = {}) {
    super();
    this.prefix = options.prefix || '[App]';
    this.enabled = options.enabled ?? true;
  }

  log(message, level = 'info') {
    if (!this.enabled) return;

    const timestamp = new Date().toISOString();
    const logMessage = `${this.prefix} [${timestamp}] ${message}`;

    switch (level) {
      case 'error':
        console.error(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }
}
