# Quant Curve Parallel Workflow

## Scope

Ветка внедряет рабочий контур для режима `Колич. анализ / График`:

- параллельные измерения стандартов;
- агрегация стандартов по среднему сигналу;
- построение уравнения градуировки;
- измерение неизвестных проб с параллельными повторами;
- расчёт концентрации по каждому повтору;
- усреднение концентраций по пробе;
- экран перехода `следующий раствор`.

## Реализованные элементы

### Domain
- `WorkflowService.aggregateCalibrationStandards()`
- `WorkflowService.buildCurveEquation()`
- `WorkflowService.setStandardConcentration()`
- `WorkflowService.appendCalibrationUnknownReplicate()`
- `WorkflowService.nextUnknownSample()`

### State
В `initialDevice()` расширен объект `calibration`:
- `standardConcentrations`
- `aggregatedStandards`
- `equation`
- `currentUnknownNo`
- `currentUnknownReplicate`
- `currentUnknownReplicates`
- `unknownResults`

### UI / Flow
- на шаге стандарта можно ввести концентрацию;
- после завершения стандартов строится уравнение;
- из окна графика можно перейти к неизвестным пробам;
- для неизвестных проб есть:
  - `calibrationUnknown`
  - `calibrationUnknownNext`

## Ограничения

Это ещё не финальный enterprise-FSM слой. Пока не реализованы:
- контекстные меню удаления для unknown-series;
- подтверждение прерывания незавершённой unknown-series;
- отдельный ActionMatrix runtime;
- полноценная загрузка сохранённого calibration method обратно в runtime.
