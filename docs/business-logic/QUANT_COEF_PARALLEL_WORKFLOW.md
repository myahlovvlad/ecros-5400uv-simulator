# Quant Coef Parallel Workflow

## Scope

Ветка внедряет рабочий контур для режима `Колич. анализ / Коэф.`:

- параллельные измерения неизвестных проб;
- ввод коэффициентов `K` и `B`;
- ввод числа повторов для unknown samples;
- расчёт концентрации по каждому повтору;
- усреднение концентрации по пробе;
- экран `следующий раствор`;
- экран `пауза` для серии коэффициентного метода.

## Реализованные элементы

### Domain / Workflow
- `WorkflowService.startCoefSampleSeries()`
- `WorkflowService.appendCoefReplicate()`
- `WorkflowService.nextCoefSample()`
- `WorkflowService.toggleCoefPause()`

### State
В `initialDevice()` расширен объект `quantCoefContext`:
- `unknownReplicates`
- `currentUnknownNo`
- `currentUnknownReplicate`
- `currentUnknownReplicates`
- `results`
- `paused`

### DeviceService
- `performQuantCoefMeasure()`
- экспорт coefficient workflow results в USB preview
- сохранение контекста для экранов `quantCoefPaused`, `quantCoefNext`

### Controller
- отдельный runtime branch для экрана `quantCoef`
- digits:
  - `1` -> ввод K
  - `2` -> ввод B
  - `3` -> ввод числа повторов
- `START/STOP`
  - первый запуск серии / pause в активной серии
- `ENTER`
  - выполнение следующего повтора
- новые экраны:
  - `quantCoefPaused`
  - `quantCoefNext`

### LCD
- основной экран coefficient workflow с номером пробы и повтором
- экран паузы
- экран `следующий раствор`

## Ограничения

Пока ещё не реализовано:
- отдельное confirm-abort для незавершённой coefficient-series;
- delete-menu для coefficient replicates / series;
- полная загрузка saved coefficient workflow context обратно в runtime.
