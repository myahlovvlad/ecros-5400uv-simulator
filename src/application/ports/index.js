/**
 * Ports - интерфейсы для внедрения зависимостей
 * Используются для мокирования в тестах
 */

/**
 * Порт для логгера
 * @interface
 */
export class LoggerPort {
  /**
   * Логирование сообщения
   * @param {string} message - Сообщение
   * @param {string} level - Уровень (info, warn, error)
   */
  log(_message, _level = 'info') {
    throw new Error('Method not implemented');
  }

  /**
   * Логирование информации
   * @param {string} message
   */
  info(message) {
    return this.log(message, 'info');
  }

  /**
   * Логирование предупреждения
   * @param {string} message
   */
  warn(message) {
    return this.log(message, 'warn');
  }

  /**
   * Логирование ошибки
   * @param {string} message
   */
  error(message) {
    return this.log(message, 'error');
  }
}

/**
 * Порт для хранилища
 * @interface
 */
export class StoragePort {
  /**
   * Сохранение данных
   * @param {string} key - Ключ
   * @param {any} value - Значение
   */
  save(_key, _value) {
    throw new Error('Method not implemented');
  }

  /**
   * Загрузка данных
   * @param {string} key - Ключ
   * @returns {any} Значение
   */
  load(_key) {
    throw new Error('Method not implemented');
  }

  /**
   * Удаление данных
   * @param {string} key - Ключ
   */
  delete(_key) {
    throw new Error('Method not implemented');
  }

  /**
   * Проверка существования
   * @param {string} key - Ключ
   * @returns {boolean} Существует ли
   */
  has(_key) {
    throw new Error('Method not implemented');
  }
}

/**
 * Порт для таймера
 * @interface
 */
export class TimerPort {
  /**
   * Установка интервала
   * @param {Function} callback - Callback
   * @param {number} ms - Интервал в мс
   * @returns {number} ID интервала
   */
  setInterval(_callback, _ms) {
    throw new Error('Method not implemented');
  }

  /**
   * Очистка интервала
   * @param {number} id - ID интервала
   */
  clearInterval(_id) {
    throw new Error('Method not implemented');
  }

  /**
   * Установка таймаута
   * @param {Function} callback - Callback
   * @param {number} ms - Таймаут в мс
   * @returns {number} ID таймаута
   */
  setTimeout(_callback, _ms) {
    throw new Error('Method not implemented');
  }

  /**
   * Очистка таймаута
   * @param {number} id - ID таймаута
   */
  clearTimeout(_id) {
    throw new Error('Method not implemented');
  }

  /**
   * Сон (задержка)
   * @param {number} ms - Миллисекунды
   * @returns {Promise<void>}
   */
  sleep(_ms) {
    throw new Error('Method not implemented');
  }
}

/**
 * Порт для устройства (Device Hardware)
 * @interface
 */
export class DeviceHardwarePort {
  /**
   * Измерение энергии
   * @param {Object} params - Параметры
   * @returns {Promise<number>} Энергия
   */
  async measureEnergy(_params) {
    throw new Error('Method not implemented');
  }

  /**
   * Установка длины волны
   * @param {number} wavelength - Длина волны
   * @returns {Promise<void>}
   */
  async setWavelength(_wavelength) {
    throw new Error('Method not implemented');
  }

  /**
   * Получение текущей длины волны
   * @returns {Promise<number>} Длина волны
   */
  async getWavelength() {
    throw new Error('Method not implemented');
  }

  /**
   * Калибровка нуля
   * @returns {Promise<number>} Энергия 100%
   */
  async calibrateZero() {
    throw new Error('Method not implemented');
  }

  /**
   * Калибровка темнового тока
   * @returns {Promise<number[]>} Значения темнового тока
   */
  async calibrateDark() {
    throw new Error('Method not implemented');
  }

  /**
   * Статус лампы
   * @param {'D2'|'W'} type - Тип лампы
   * @returns {Promise<boolean>} Статус
   */
  async getLampStatus(_type) {
    throw new Error('Method not implemented');
  }

  /**
   * Установка лампы
   * @param {'D2'|'W'} type - Тип лампы
   * @param {boolean} enabled - Включить
   * @returns {Promise<void>}
   */
  async setLamp(_type, _enabled) {
    throw new Error('Method not implemented');
  }
}
