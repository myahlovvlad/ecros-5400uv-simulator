# FSM Workflow Foundation

Этот документ фиксирует базовый каркас FSM и workflow, внедрённый в репозиторий симулятора.

## Что добавлено

- `src/domain/entities/workflowTypes.js`
  - перечисления режимов, состояний задачи и состояний нуля
- `src/domain/usecases/workflowGuards.js`
  - guard-функции для переходов
- `src/application/services/WorkflowService.js`
  - заготовка единого orchestration-слоя
- расширение `initialDevice()`
  - `mode`
  - `fsmState`
  - `taskState`
  - `zeroState`
  - контексты фотометрии, коэффициентного метода и многоволнового режима
- расширение меню и LCD
  - пункт `МНОГОВ. АНАЛИЗ`
  - подпункт `СТАТИСТИКА`
- минимальная интеграция маршрутов
  - `multiwlMain`
  - `multiwlFormula`
  - `multiwlRun`
  - `settingsStatMode`

## Текущий объём

Реализация в этой ветке — это **рабочий foundation-layer**, а не завершённая полная миграция всей бизнес-логики на единый FSM.

Что уже работает:

- новые доменные типы и guard-слой;
- новые поля состояния прибора;
- базовая навигация в `МНОГОВ. АНАЛИЗ`;
- выбор статистики в настройках;
- минимальный workflow многоволнового режима с запуском и паузой;
- фотометрия теперь использует `zeroState` и фото-серию в state foundation.

Что ещё предстоит:

- полная замена `ScreenHandlers` на таблицу переходов;
- выделение `fsmState` как основного источника истины для LCD;
- полноценная серия параллельных измерений для `График` и `Коэф.`;
- контекстные меню удаления;
- экран `следующий раствор`;
- подтверждение прерывания незавершённой серии.

## Рекомендуемый следующий шаг

Следующим PR рекомендуется внедрить:

1. `ActionMatrix.js`
2. `StateTransitionTable.js`
3. отдельный reducer/state-machine layer поверх `useDeviceController`
4. отдельные экраны:
   - `PHOTO_WAIT_NEXT_SAMPLE`
   - `QK_PAUSED`
   - `QC_UNKNOWN_MEASURE`
   - `CONFIRM_ABORT`
