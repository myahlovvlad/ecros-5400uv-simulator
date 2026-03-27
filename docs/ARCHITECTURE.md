# Архитектура ЭКРОС-5400УФ Симулятор

## Clean Architecture

Проект рефакторен с использованием принципов Clean Architecture для улучшения поддерживаемости, тестируемости и разделения ответственности.

## Структура проекта

```
src/
├── domain/                     # Доменный слой (бизнес-логика)
│   ├── constants/              # Константы и конфигурация
│   │   └── index.js
│   ├── entities/               # Типы и сущности
│   │   └── index.js (JSDoc типы)
│   └── usecases/               # Бизнес-правила и функции
│       ├── index.js            # Основные use cases
│       └── utils.js            # Утилиты (clamp, sleep, pad, center)
│
├── application/                # Прикладной слой
│   ├── services/               # Сервисы приложения
│   │   ├── DeviceService.js    # Логика устройства
│   │   ├── CliService.js       # Обработка CLI команд
│   │   └── ScreenHandlers.js   # Обработчики экранов
│   └── ports/                  # Интерфейсы (будущее расширение)
│
├── infrastructure/             # Инфраструктурный слой
│   ├── adapters/               # Адаптеры
│   │   └── LcdRenderer.js      # Рендеринг LCD
│   └── cli/                    # CLI адаптеры
│
└── presentation/               # Слой представления (UI)
    ├── components/             # React компоненты
    │   ├── Ecros5400UvSimulator.jsx  # Главный компонент
    │   ├── LcdCanvas.jsx       # LCD дисплей
    │   ├── ButtonKey.jsx       # Кнопка
    │   ├── DevicePanel.jsx     # Панель управления
    │   ├── DeviceStatus.jsx    # Состояние устройства
    │   ├── MeasurementTable.jsx # Таблица измерений
    │   ├── CliEmulator.jsx     # CLI консоль
    │   ├── NavigationInfo.jsx  # Навигация
    │   └── AppHeader.jsx       # Заголовок
    ├── hooks/                  # Кастомные хуки
    │   └── useDeviceController.js  # Управление устройством
    └── contexts/               # React контексты (будущее расширение)
```

## Слои архитектуры

### Domain Layer (доменный)

**Зависимости:** Нет внешних зависимостей

**Ответственность:**
- Бизнес-правила предметной области
- Константы устройства
- Типы данных (JSDoc)
- Функции измерений и расчётов

**Ключевые файлы:**
- `domain/constants/index.js` - все константы (LCD, меню, диапазоны)
- `domain/usecases/index.js` - `measureSample()`, `referenceEnergyAt()`, `absorbanceForSample()`
- `domain/usecases/utils.js` - утилиты `clamp()`, `sleep()`, `pad()`, `center()`

### Application Layer (прикладной)

**Зависимости:** domain layer

**Ответственность:**
- Координация бизнес-логики
- Обработка действий пользователя
- Сервисы приложения

**Ключевые файлы:**
- `application/services/DeviceService.js` - операции устройства (ZERO, измерения, калибровка)
- `application/services/CliService.js` - обработка CLI команд с валидацией
- `application/services/ScreenHandlers.js` - обработчики для каждого экрана

### Infrastructure Layer (инфраструктурный)

**Зависимости:** domain layer, application layer

**Ответственность:**
- Адаптеры для внешних систем
- Рендеринг LCD
- CLI эмулятор

**Ключевые файлы:**
- `infrastructure/adapters/LcdRenderer.js` - рендеринг строк LCD

### Presentation Layer (представления)

**Зависимости:** Все слои выше

**Ответственность:**
- React компоненты
- Управление состоянием (hooks)
- UI логика

**Ключевые файлы:**
- `presentation/hooks/useDeviceController.js` - центральный хук управления
- `presentation/components/Ecros5400UvSimulator.jsx` - главный компонент
- `presentation/components/*.jsx` - UI компоненты

## Исправленные проблемы

### P0 - Критические

#### 1. Dependency array в useEffect
**Файл:** `presentation/hooks/useDeviceController.js:252-267`

```javascript
useEffect(() => {
  const handler = (e) => { /* ... */ };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}, [device.screen, device.calibration, nextCalibrationStep, handleAction]); // ✅ Добавлен dependency array
```

#### 2. Очистка kinetic timer при unmount
**Файл:** `presentation/hooks/useDeviceController.js:145-151`

```javascript
useEffect(() => {
  return () => {
    if (kineticTimerRef.current) {
      clearInterval(kineticTimerRef.current);
      kineticTimerRef.current = null;
    }
  };
}, []); // ✅ Очистка при размонтировании
```

### P1 - Важные

#### 3. Рефакторинг handleAction
**Файл:** `application/services/ScreenHandlers.js`

Большая функция `handleAction` (200+ строк) разбита на отдельные обработчики:
- `handleMainScreen()`
- `handlePhotometryScreen()`
- `handleCalibrationStepScreen()`
- и т.д. (16 обработчиков)

#### 4. Валидация CLI команд
**Файл:** `application/services/CliService.js`

Добавлена валидация:
```javascript
case "swl":
case "swm": {
  const parsed = parseFloat(arg || String(state.wavelength));
  if (Number.isNaN(parsed)) {
    return reply("Error: invalid wavelength");
  }
  // ...
}
```

### P2 - Улучшения

#### 5. Вынос констант и бизнес-логики
- Все константы в `domain/constants/index.js`
- Бизнес-логика в `domain/usecases/index.js`
- Утилиты в `domain/usecases/utils.js`

## Поток данных

```
User Action (UI)
    ↓
Presentation Layer (handleAction)
    ↓
Application Layer (ScreenHandlers, DeviceService)
    ↓
Domain Layer (measureSample, validateWavelength)
    ↓
Application Layer (update state)
    ↓
Presentation Layer (re-render)
```

## Использование

### Импорт из React компонента

```jsx
import { useDeviceController } from './src/hooks/useDeviceController';

function MyComponent() {
  const {
    device,
    handleAction,
    executeCli,
    resetAll,
  } = useDeviceController();

  return (
    <div>
      <button onClick={() => handleAction('ZERO')}>ZERO</button>
    </div>
  );
}
```

### Тестирование бизнес-логики

```javascript
// Можно тестировать domain слой без React
import { measureSample, validateWavelength } from './src/domain/usecases';

describe('measureSample', () => {
  it('должна возвращать корректные значения', () => {
    const result = measureSample({
      sample: 'reference',
      wavelength: 546,
      gain: 1,
      e100: 33869,
      darkValues: [39, 74, 152, 302, 585, 1079, 1880, 3148],
    });
    expect(result.a).toBe(0);
  });
});
```

## Преимущества новой архитектуры

1. **Разделение ответственности** - каждый слой имеет чёткую задачу
2. **Тестируемость** - domain слой можно тестировать без React
3. **Поддерживаемость** - легче найти и исправить баги
4. **Масштабируемость** - легко добавить новые функции
5. **Читаемость** - код организован логически

## Обратная совместимость

Файл `ecros_5400_uv_simulator.jsx` теперь является wrapper'ом:

```jsx
import React from "react";
import { Ecros5400UvSimulator } from "./src/index.js";

export default Ecros5400UvSimulator;
```

## Будущие улучшения

1. Добавить TypeScript для типизации
2. Вынести контексты в отдельные файлы
3. Добавить unit тесты для domain слоя
4. Реализовать ports для мокирования зависимостей
