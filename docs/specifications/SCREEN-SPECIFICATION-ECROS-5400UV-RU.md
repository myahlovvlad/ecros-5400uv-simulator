# Объединённая спецификация экранов ECROS-5400UV

Версия: draft 2026-04-15

## Назначение

Этот документ нормализует разрозненные screen-map файлы из `docs/screen-map` в единую спецификацию экранов. Исходные `Screen ID` сохранены только как трассировочные значения, потому что в `.txt` они повторяются и местами обозначают разные состояния.

Runtime-ключ `id` пока не меняется, чтобы не ломать симулятор. Новый `canonicalId` используется как стабильный ID для ТЗ, аудита и коммуникации с подрядчиком.

## Схема идентификации

| Поле | Назначение |
| --- | --- |
| `canonicalId` | Стабильный ID для ТЗ. Не зависит от нарушенной исходной индексации. |
| `id` | Текущий runtime screen id в React/state machine. |
| `legacyWnd` | Внутренняя метка `WND-*` в симуляторе. |
| `sourceScreenIds` | Исходные `Screen ID` из `.txt`, включая повторы и конфликтные значения. |
| `sourceIntegrity` | Качество связи с исходниками: `reindexed`, `merged`, `ambiguous`, `runtime-only`. |
| `implementationStatus` | Статус runtime-реализации: `implemented`, `partial`, `missing`, `runtime-only`. |

## Canonical Prefixes

| Prefix | Область |
| --- | --- |
| `SYS-*` | Загрузка, диагностика, прогрев. |
| `MAIN-*` | Главное меню и входы в режимы. |
| `PHOT-*` | Фотометрия. |
| `QUANT-*` | Количественный анализ и градуировка. |
| `KIN-*` | Кинетика. |
| `MW-*` | Многоволновой анализ. |
| `SET-*` | Настройки и версия. |
| `FILE-*` | Файловый менеджер и сохранение. |
| `SHARED-*` | Общие диалоги, ввод и предупреждения. |

## Сводная таблица экранов

| Canonical ID | Runtime ID | WND | Название | Режим | Тип | Source ID | Статус | Целостность |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `SYS-BOOT` | `boot` | `WND-01` | Приветственное окно | system | system | `1-1` | implemented | merged |
| `SYS-DIAGNOSTIC` | `diagnostic` | `WND-02` | Диагностика | system | system | `1-2` | implemented | merged |
| `SYS-WARMUP` | `warmup` | `WND-03` | Прогрев | system | system | `1-3` | implemented | merged |
| `MAIN-MENU` | `main` | `WND-04` | Главное меню | shared | menu | `1-4` | implemented | merged |
| `PHOT-MAIN` | `photometry` | `WND-05` | Фотометрия | photometry | measurement | `1-5-1`, `1-5-2`, `1-5-3` | implemented | merged |
| `PHOT-SIGNAL` | `photometryValue` | `WND-06` | Выбор величины фотометрии | photometry | menu | `1-5-1-2`, `1-5-1-2-1`, `1-5-1-2-4` | implemented | merged |
| `PHOT-GRAPH` | `photometryGraph` | `WND-07` | График фотометрии | photometry | graph | `1-5-1-8`, `1-5-1-9` | implemented | reindexed |
| `FILE-ROOT` | `fileRoot` | `WND-08` | Группы файлов | files | file | `file-root` | implemented | runtime-only |
| `FILE-LIST` | `fileList` | `WND-09` | Список файлов | files | file | `file-list` | implemented | runtime-only |
| `FILE-ACTION` | `fileActionMenu` | `WND-10` | Действия с файлом | files | file | `file-action` | implemented | runtime-only |
| `FILE-SAVE` | `saveDialog` | `WND-11` | Сохранение файла | files | dialog | `save-dialog` | implemented | runtime-only |
| `SHARED-INPUT` | `input` | `WND-12` | Ввод данных | shared | input | `1-5-1-1-1`, `1-5-1-1-2`, `1-5-1-1-3` | implemented | merged |
| `QUANT-MAIN` | `quantMain` | `WND-13` | Количественный анализ | quantitative | menu | `1-6-1`, `1-6-2` | implemented | ambiguous |
| `QUANT-UNITS` | `quantUnits` | `WND-14` | Единицы измерения | quantitative | menu | `1-6-1` | implemented | ambiguous |
| `QUANT-COEF` | `quantCoef` | `WND-15` | Коэффициенты | quantitative | measurement | `1-6-1`, `1-6-1-1-32`, `1-6-1-1-33`, `1-6-1-1-34` | implemented | ambiguous |
| `QUANT-CAL-STANDARDS` | `calibrationSetupStandards` | `WND-16` | Новая градуировка: стандарты | quantitative | input | `1-6-1-1`, `1-6-1-1-2` | implemented | reindexed |
| `QUANT-CAL-PARALLELS` | `calibrationSetupParallels` | `WND-17` | Новая градуировка: параллели | quantitative | input | `1-6-1-1-3`, `1-6-1-1-4` | implemented | reindexed |
| `QUANT-CAL-PLAN` | `calibrationPlan` | `WND-18` | План измерений градуировки | quantitative | menu | `1-6-1-1-5`, `1-6-1-1-6` | implemented | reindexed |
| `QUANT-CAL-STEP` | `calibrationStep` | `WND-19` | Шаг градуировки | quantitative | measurement | `1-6-1-1-7` ... `1-6-1-1-26` | implemented | merged |
| `QUANT-CAL-JOURNAL` | `calibrationJournal` | `WND-20` | Журнал градуировки | quantitative | measurement | `1-6-1-1-27` ... `1-6-1-1-31` | implemented | reindexed |
| `QUANT-CAL-GRAPH` | `calibrationGraph` | `WND-21` | График градуировки | quantitative | graph | `1-6-1-1-32`, `1-6-1-1-33`, `1-6-1-1-34` | implemented | reindexed |
| `KIN-MENU` | `kineticsMenu` | `WND-22` | Кинетика: параметры | kinetics | menu | `1-4-1`, `1-4-1-1` | implemented | merged |
| `KIN-RUN` | `kineticsRun` | `WND-23` | Кинетика: измерение | kinetics | measurement | `1-6-1-1-27` | implemented | ambiguous |
| `KIN-GRAPH` | `kineticsGraph` | `WND-24` | График кинетики | kinetics | graph | `1-6-1-1-27` | implemented | ambiguous |
| `MW-MENU` | `multiWaveMenu` | `WND-25` | Многоволновой анализ | multiWave | menu | `multi-wave-menu` | implemented | runtime-only |
| `MW-SETUP` | `multiWaveSetup` | `WND-26` | Настройка длин волн | multiWave | input | `multi-wave-setup` | implemented | runtime-only |
| `MW-RUN` | `multiWaveRun` | `WND-27` | Многоволновое измерение | multiWave | measurement | `multi-wave-run` | implemented | runtime-only |
| `MW-JOURNAL` | `multiWaveJournal` | `WND-28` | Журнал многоволнового анализа | multiWave | measurement | `multi-wave-journal` | implemented | runtime-only |
| `MW-GRAPH` | `multiWaveGraph` | `WND-29` | График многоволнового анализа | multiWave | graph | `multi-wave-graph` | implemented | runtime-only |
| `SET-MAIN` | `settings` | `WND-30` | Настройки | settings | menu | `1-4`, `1-5` | implemented | ambiguous |
| `SET-VERSION` | `version` | `WND-31` | Версия | settings | system | `1-4`, `1-5` | implemented | ambiguous |
| `SHARED-WARNING` | `warning` | `WND-32` | Предупреждение | shared | dialog | `warning` | implemented | runtime-only |

## Нормализованные переходы

Переходы хранятся в `src/domain/constants/screens.json` как массивы `{ action, target, condition?, source? }`. Это важно: одна и та же кнопка может вести в разные target в зависимости от индекса меню или текущего режима.

Ключевые переходы первого уровня:

| From | Action | Target | Условие |
| --- | --- | --- | --- |
| `SYS-BOOT` / `boot` | timer | `diagnostic` | завершение заставки |
| `SYS-DIAGNOSTIC` / `diagnostic` | done | `warmup` | диагностика завершена |
| `SYS-WARMUP` / `warmup` | esc/timer | `main` | пропуск или завершение прогрева |
| `MAIN-MENU` / `main` | enter | `photometry` | выбран пункт "Фотометрия" |
| `MAIN-MENU` / `main` | enter | `quantMain` | выбран пункт "Колич. анализ" |
| `MAIN-MENU` / `main` | enter | `kineticsMenu` | выбран пункт "Кинетика" |
| `MAIN-MENU` / `main` | enter | `multiWaveMenu` | выбран пункт "Многоволн." |
| `MAIN-MENU` / `main` | enter | `settings` | выбран пункт "Настройки" |

## Матрица расхождений

| Source / проблема | Canonical решение | Runtime состояние |
| --- | --- | --- |
| `1-1`, `1-2`, `1-3`, `1-4` повторяются во всех режимах | `SYS-*` и `MAIN-MENU` | implemented |
| `1-6-1` обозначает разные quantitative screens | `QUANT-MAIN`, `QUANT-COEF`, `QUANT-UNITS` | implemented, `sourceIntegrity=ambiguous` |
| `1-6-1-1-27` есть в quantitative и kinetics | `QUANT-CAL-JOURNAL`, `KIN-RUN`, `KIN-GRAPH` | implemented, `sourceIntegrity=ambiguous` |
| `1-5-1-1-3` описывает отдельное окно установки lambda | `SHARED-INPUT` + runtime busy state | поведение реализовано, отдельного `state.screen` нет |
| MultiWave screens есть в runtime, но нет отдельного `.txt` source map | `MW-*` | implemented, `sourceIntegrity=runtime-only` |
| File manager screens есть в runtime, но не описаны в `.txt` source map | `FILE-*` | implemented, `sourceIntegrity=runtime-only` |

## Правила дальнейшей синхронизации

1. Новые экраны добавлять сначала в `src/domain/constants/screens.json`.
2. Если исходный `.txt` содержит конфликтный `Screen ID`, не использовать его как ключ; добавлять его в `sourceScreenIds`.
3. Runtime `state.screen` менять только отдельной миграцией после стабилизации спецификации.
4. LCD-глифы аудировать после фиксации строк и полей в этой спецификации.
