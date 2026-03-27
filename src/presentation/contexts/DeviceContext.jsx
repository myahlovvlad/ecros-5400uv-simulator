/**
 * DeviceContext - контекст устройства
 * Предоставляет состояние устройства и действия всему приложению
 */

import React, { createContext, useContext } from 'react';
import { useDeviceController } from '../hooks/useDeviceController.js';

const DeviceContext = createContext(null);

/**
 * Провайдер контекста устройства
 */
export function DeviceProvider({ children }) {
  const deviceController = useDeviceController();

  return (
    <DeviceContext.Provider value={deviceController}>
      {children}
    </DeviceContext.Provider>
  );
}

/**
 * Хук для использования контекста устройства
 * @returns {ReturnType<typeof useDeviceController>}
 */
export function useDevice() {
  const context = useContext(DeviceContext);
  
  if (!context) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  
  return context;
}

/**
 * Селектор для подписки на часть состояния
 * @param {Function} selector - Функция селектора
 * @returns {any} Выбранное значение
 */
export function useDeviceSelector(selector) {
  const device = useDevice();
  return selector(device.device);
}
