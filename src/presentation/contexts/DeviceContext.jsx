/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo } from "react";
import { useDeviceController } from "../hooks/useDeviceController.js";

const DeviceContext = createContext(null);
DeviceContext.displayName = "DeviceContext";

export function DeviceProvider({ children, initialDeviceState = null }) {
  const deviceController = useDeviceController(initialDeviceState);

  return (
    <DeviceContext.Provider value={deviceController}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  const context = useContext(DeviceContext);

  if (!context) {
    throw new Error("useDevice must be used within a DeviceProvider");
  }

  return context;
}

export function useDeviceSelector(selector) {
  const device = useDevice();
  return useMemo(() => selector(device.device), [device.device, selector]);
}
