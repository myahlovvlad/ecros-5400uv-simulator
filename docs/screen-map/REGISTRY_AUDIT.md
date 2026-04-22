# Screen Registry Audit

## Источники

Первый проход registry нормализует четыре текстовых карты:

- `Photometry_screen map ECROS-5400UV_RU.txt`
- `Quantitative analysis_screen map_ECROS-5400UV_RU.txt`
- `Kinetic_screen_map_ECROS-5400UV_RU.txt`
- `Settings_ECROS-5400UV-Screen_map_RU.txt`

## Повторяющиеся исходные Screen ID

Эти ID нельзя использовать как уникальные runtime-ключи:

- `1-1`, `1-2`, `1-3`, `1-4` повторяются как общий boot/diagnostic/warmup/main flow почти в каждом сценарии.
- `1-6-1` в quantitative map используется для разных состояний меню, коэффициентов и единиц.
- `1-6-1-1-27` встречается и в quantitative calibration journal, и в kinetic run/graph контексте.
- `1-5-1`, `1-5-1-1-2`, `1-5-1-1-3`, `1-5-1-8`, `1-5-1-9` переиспользуются между photometry и kinetic wavelength/record flows.
- В settings map `1-4` используется для нескольких настроечных экранов, а в одном месте рядом появляется `1-5`.

## Source Screens, сведенные к одному Runtime Screen

- Все boot screens `1-1` сведены к `boot`.
- Все diagnostics screens `1-2` сведены к `diagnostic`.
- Все warmup screens `1-3` сведены к `warmup`.
- Все main menu screens `1-4` сведены к `main`, кроме настроечных вариантов, отраженных в `settings`/`version`.
- Photometry value-selection варианты `1-5-1-2*` сведены к `photometryValue`.
- Quantitative screens с повторным `1-6-1` разделены на `quantMain`, `quantCoef`, `quantUnits`, но сохраняют исходный ID в `sourceScreenIds`.
- Calibration step диапазон `1-6-1-1-7` ... `1-6-1-1-26` сведен к `calibrationStep`, потому что runtime использует один экран с динамическим текущим стандартом/параллелью.
- Kinetic parameter screens `1-4-1*` сведены к `kineticsMenu` и `input`.

## Source Screens, которых пока нет как отдельного Runtime Screen

- Отдельный экран "Установка λ" из `1-5-1-1-3` сейчас моделируется через общий `busy` state, а не через отдельный `state.screen`.
- Несколько quantitative coefficient substates из `1-6-1` сейчас представлены одним `quantCoef` экраном с input dialog.
- Детальные settings substates для отдельных операций темнового тока/калибровки λ сейчас представлены через `busy` и `warning`.
- MultiWave runtime screens существуют в симуляторе, но в текущем наборе `.txt` нет отдельного screen-map файла для этого режима.

## Canonical Indexing

Единая спецификация использует `canonicalId`, а не исходный `Screen ID`. Runtime `state.screen` пока сохранён без миграции.

| Canonical prefix | Назначение |
| --- | --- |
| `SYS-*` | Загрузка, диагностика, прогрев |
| `MAIN-*` | Главное меню |
| `PHOT-*` | Фотометрия |
| `QUANT-*` | Количественный анализ и градуировка |
| `KIN-*` | Кинетика |
| `MW-*` | Многоволновой анализ |
| `SET-*` | Настройки |
| `FILE-*` | Файловый менеджер |
| `SHARED-*` | Общие диалоги |

## Status Matrix

| Runtime screen | Canonical ID | Source integrity | Notes |
| --- | --- | --- | --- |
| `boot` | `SYS-BOOT` | `merged` | Общий `1-1` из всех режимов |
| `diagnostic` | `SYS-DIAGNOSTIC` | `merged` | Общий `1-2` из всех режимов |
| `warmup` | `SYS-WARMUP` | `merged` | Общий `1-3` из всех режимов |
| `main` | `MAIN-MENU` | `merged` | Общий `1-4`, но settings map переиспользует его для других состояний |
| `photometry` | `PHOT-MAIN` | `merged` | Объединяет основные фотометрические состояния `1-5-*` |
| `input` | `SHARED-INPUT` | `merged` | Ввод λ, коэффициентов, параметров кинетики и имени файла |
| `quantMain` | `QUANT-MAIN` | `ambiguous` | Исходный `1-6-1` конфликтует с другими quantitative состояниями |
| `quantCoef` | `QUANT-COEF` | `ambiguous` | Часть coefficient flow тоже записана как `1-6-1` |
| `quantUnits` | `QUANT-UNITS` | `ambiguous` | Единицы в исходнике тоже записаны как `1-6-1` |
| `calibrationStep` | `QUANT-CAL-STEP` | `merged` | Диапазон `1-6-1-1-7` ... `1-6-1-1-26` представлен одним динамическим экраном |
| `kineticsRun` | `KIN-RUN` | `ambiguous` | Использует исходный `1-6-1-1-27`, пересекающийся с quantitative |
| `kineticsGraph` | `KIN-GRAPH` | `ambiguous` | Тот же конфликтный исходный ID в kinetic context |
| `settings` | `SET-MAIN` | `ambiguous` | Settings map многократно переиспользует `1-4` |
| `multiWave*` | `MW-*` | `runtime-only` | Runtime реализован, отдельный `.txt` source map пока отсутствует |
| `file*` | `FILE-*` | `runtime-only` | Runtime реализован, в source maps не описан отдельным режимом |

## Единая спецификация

Нормализованная объединённая версия создана в `docs/specifications/SCREEN-SPECIFICATION-ECROS-5400UV-RU.md`. Она является рабочей спецификацией для дальнейшего согласования: старые `.txt` остаются исходными артефактами, а исправленная индексация живёт в `canonicalId`.
