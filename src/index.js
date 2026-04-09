/**
 * Ecros 5400UV Simulator - точка входа
 * Clean Architecture
 */

// Domain Layer
export * from './domain/constants/index.js';
export * from './domain/usecases/index.js';

// Application Layer
export { DeviceService } from './application/services/DeviceService.js';
export { CliService } from './application/services/CliService.js';
export * from './application/services/ScreenHandlers.js';
export * from './application/ports/index.js';

// Infrastructure Layer
export { getLcdRows } from './infrastructure/adapters/LcdRenderer.js';
export { ConsoleLogger } from './infrastructure/adapters/ConsoleLogger.js';
export { MemoryStorage } from './infrastructure/adapters/MemoryStorage.js';
export { LocalStorageAdapter } from './infrastructure/adapters/LocalStorageAdapter.js';

// Presentation Layer - Components
export { Ecros5400UvSimulator } from './presentation/components/Ecros5400UvSimulator.jsx';
export { LcdCanvas } from './presentation/components/LcdCanvas.jsx';
export { ButtonKey } from './presentation/components/ButtonKey.jsx';
export { DevicePanel } from './presentation/components/DevicePanel.jsx';
export { DeviceMetricsCard, VirtualSampleCard } from './presentation/components/DeviceStatus.jsx';
export { InstrumentPanel } from './presentation/components/InstrumentPanel.jsx';
export { MeasurementTable } from './presentation/components/MeasurementTable.jsx';
export { CliEmulator } from './presentation/components/CliEmulator.jsx';
export { NavigationInfo } from './presentation/components/NavigationInfo.jsx';
export { AppHeader } from './presentation/components/AppHeader.jsx';
export { UsbExportPanel } from './presentation/components/UsbExportPanel.jsx';
export { PanelLabelEditorCard, CCodeGeneratorCard } from './presentation/components/PanelLabelEditor.jsx';
export { LcdTextEditor } from './presentation/components/LcdTextEditor.jsx';

// Presentation Layer - Hooks
export { useDeviceController } from './presentation/hooks/useDeviceController.js';

// Presentation Layer - Contexts
export { DeviceProvider, useDevice, useDeviceSelector } from './presentation/contexts/DeviceContext.jsx';
export { ThemeProvider, useTheme } from './presentation/contexts/ThemeContext.jsx';
export { SettingsProvider, useSettings } from './presentation/contexts/SettingsContext.jsx';
