# Action Matrix Runtime

## Scope

Этот stacked PR вводит исполнимый слой маршрутизации экранных действий поверх существующего симулятора:

- `ActionMatrix.js`
- `ScreenRouter.js`
- упрощённый `useDeviceController`, который теперь делегирует экранные действия в единый router.

## Цель

Убрать разрастание ручного `switch(device.screen)` в `useDeviceController` и перевести проект к модели:

`screen + action -> router -> matrix/handler -> state transition`

## Что реализовано

### 1. `SCREEN_HANDLER_MAP`

В `ActionMatrix.js` собрана canonical map для legacy-safe экранов, которые уже имеют стабильные handler-функции в `ScreenHandlers.js`:

- main
- fileRoot / fileList / fileActionMenu
- photometry / photometryValue
- quantMain / quantUnits
- calibrationSetupStandards / calibrationSetupParallels / calibrationPlan / calibrationJournal
- kineticsMenu / kineticsRun
- multiwlMain / multiwlFormula / multiwlRun
- settings / settingsStatMode / version
- warning / warmup / input / saveDialog

### 2. `SCREEN_ACTION_MATRIX`

Для special-case экранов введена исполнимая action-matrix:

- `photometryGraph`
- `kineticsGraph`
- `quantCoef`
- `quantCoefPaused`
- `quantCoefNext`
- `calibrationStep`
- `calibrationGraph`
- `calibrationUnknown`
- `calibrationUnknownNext`

### 3. `ScreenRouter`

`routeScreenAction(state, action, actions)` теперь:

1. сначала ищет обработчик в `SCREEN_ACTION_MATRIX`
2. если его нет — использует `SCREEN_HANDLER_MAP`
3. если экран не зарегистрирован — возвращает `undefined`

### 4. `useDeviceController`

`handleAction()` больше не содержит большой архитектурный `switch` по экранам.

Теперь controller:
- собирает action-context;
- передаёт его в `routeScreenAction()`;
- сохраняет существующие measurement side-effects и timers.

## Что это даёт

- централизованный executable routing layer;
- возможность постепенно переносить special-case логики из controller в matrix;
- меньше coupling между controller и screen-specific логикой;
- более прямой путь к будущему tabular `StateTransitionTable runtime`.

## Что пока НЕ сделано

- не все экраны переведены на единую табличную модель;
- `ScreenHandlers.js` пока остаётся legacy-compat слоем;
- guards и transition metadata пока не вынесены в отдельные runtime rows вида `CurrentState | Event | Guard | ActionFn | NextState`;
- confirm-abort и delete-menus пока не переведены на matrix runtime.

## Следующий шаг

Следующий разумный PR после этого:

1. ввести `TransitionRows.js`
2. добавить guards в executable rows
3. перевести `quantCurve` и `photometry` next-sample / confirm-abort screens на ту же matrix-модель
4. начать рендер `fsmState` как primary source of truth вместо `screen`-centric routing
