# Реестр конфликтов screen-map

Дата сверки: 2026-04-22

## Статус документа

Этот файл фиксирует ручную сверку первичных карт экранов с текущей нормализованной спецификацией и runtime-реестром.

Источники уровня 1:

- `docs/screen-map/Photometry_screen map ECROS-5400UV_RU.txt`
- `docs/screen-map/Quantitative analysis_screen map_ECROS-5400UV_RU.txt`
- `docs/screen-map/Kinetic_screen_map_ECROS-5400UV_RU.txt`
- `docs/screen-map/Settings_ECROS-5400UV-Screen_map_RU.txt`

Сверяемые производные/реализационные артефакты:

- `docs/screen-map/REGISTRY_AUDIT.md`
- `docs/specifications/SCREEN-SPECIFICATION-ECROS-5400UV-RU.md`
- `docs/specifications/screenmap-ru.html`
- `docs/specifications/SCREEN-LCD-SPECIFICATION-ECROS-5400UV-RU.html`
- `src/domain/constants/screens.json`
- `lcd-glyph-simulator/`

## Методика

1. Извлечены все вхождения `Screen` / `Screen:` из четырех первичных `.txt` карт.
2. Подсчитаны повторы внутри каждого файла и пересечения между файлами.
3. Все исходные numeric `Screen ID` сопоставлены с `sourceScreenIds` из `src/domain/constants/screens.json`.
4. Конфликты не разрешались выбором одной стороны: если два источника уровня 1 используют один ID для разных смыслов, конфликт остается открытым.
5. Дополнительно проанализирован `lcd-glyph-simulator` как реализационный артефакт LCD-глифов. Он не содержит screen-flow или canonical screen ID, поэтому не повышает и не понижает приоритет первичных `.txt`, но фиксирует риски отображения строк LCD.

## Сводка покрытия

| Метрика | Значение |
| --- | --- |
| Photometry: ссылок на Screen ID / уникальных ID | 68 / 18 |
| Quantitative: ссылок на Screen ID / уникальных ID | 95 / 42 |
| Kinetic: ссылок на Screen ID / уникальных ID | 81 / 13 |
| Settings: ссылок на Screen ID / уникальных ID | 57 / 5 |
| Numeric `Screen ID` из `.txt`, отсутствующие в `screens.json.sourceScreenIds` | `1-5-1-2-2`, `1-5-1-6`, `1-5-1-7` |
| lcd-glyph-simulator: источник глифов | `glyph-specification-lcd-128x64-v2.2(1).md`, версия 2.2 |
| lcd-glyph-simulator: всего глифов / диагностик | 230 / 25 |
| lcd-glyph-simulator: варианты | 5 px: 77 глифов; 6 px: 75 глифов; 8 px: 78 глифов |

## LCD-glyph слой

`lcd-glyph-simulator` является отдельным runtime/prototype-инструментом для рендера пиксельных глифов на LCD 128x64. В нем нет описания сценариев, `Screen ID`, `canonicalId`, `WND-*` или переходов между экранами. Поэтому он не разрешает конфликты screen-map, но добавляет отдельные ограничения для LCD-спецификаций и HTML-превью.

| Область | Наблюдение | Риск для спецификации |
| --- | --- | --- |
| Покрытие вариантов 5 px / 6 px | Наборы 5 px и 6 px содержат цифры, строчные русские, строчные латинские и часть специальных символов. Они не покрывают заглавные русские/латинские строки, которые используются в LCD-макетах. | Нельзя использовать 5/6 px как универсальный шрифт для текущих экранов без fallback или преобразования регистра. |
| Покрытие варианта 8 px | 8 px содержит заглавные русские/латинские, цифры и спецсимволы, но не содержит `_`, `[`, `]` и строчные `a`, `m`, `q`, `u`, `v`, `w`, встречающиеся в generated LCD data / runtime labels. | При рендере служебных строк, расширений файлов или латинских lowercase будут fallback-глифы. |
| Диагностика размеров | `glyphs.compiled.json` фиксирует 25 несовпадений номинальных и фактических размеров: 10 для 5 px, 10 для 6 px, 5 для 8 px. | Документация глифов и renderer должны считать `actualWidth`/`actualHeight` более надежными, чем заявленные размеры. |
| Глиф `№` в 8 px | Заявлен как `7x8`, фактически распарсен как `11x9`. | Табличные строки с `№` могут занимать больше места, чем ожидается по номинальной спецификации. |
| Диакритика `Ё/Й/ё/й` | Верхние диакритические строки сохраняются через `topOffset`; фактическая высота может быть больше номинальной. | Высота строки должна рассчитываться по `maxActualHeight`, иначе возможна обрезка. |
| Текст UI/demo в `app.js` | В `app.js` обнаружены mojibake-строки в начальном demo text и сообщениях интерфейса. | Не влияет на screen-map, но снижает доверие к `lcd-glyph-simulator` как к эталонному визуальному артефакту без предварительной правки кодировки. |

## Конфликты идентичности Screen ID

| ID | Затронутые источники | Наблюдение | Текущий статус в спецификации/runtime | Решение |
| --- | --- | --- | --- | --- |
| `1-1` | Все 4 `.txt` | Общая заставка повторяется во всех сценариях. | `SYS-BOOT`, `sourceIntegrity=merged`. | Принято как общий системный экран. |
| `1-2` | Все 4 `.txt` | Общая диагностика повторяется во всех сценариях. | `SYS-DIAGNOSTIC`, `sourceIntegrity=merged`. | Принято как общий системный экран. |
| `1-3` | Все 4 `.txt` | Общий прогрев повторяется во всех сценариях. | `SYS-WARMUP`, `sourceIntegrity=merged`. | Принято как общий системный экран. |
| `1-4` | Все 4 `.txt` | В photometry/quantitative/kinetic это главное меню, в settings тот же ID используется для меню настроек, D2/W lamp states, темнового тока, смены ламп, калибровки lambda и даты/времени. | `MAIN-MENU`, `SET-MAIN`, `SET-VERSION`, `sourceIntegrity=ambiguous` для settings/version. | Открыто. Нужна декомпозиция settings-состояний на отдельные canonical ID. |
| `1-5-1` | Photometry, Kinetic | В photometry это основной экран фотометрии; в kinetic тот же ID используется для измерительного/графического экрана кинетики. | В `screens.json` привязан к `PHOT-MAIN`; kinetic-вхождения не отражены через этот source ID. | Открыто. Нельзя использовать `1-5-1` как уникальный ключ photometry без контекста файла/режима. |
| `1-5-1-1-1` | Photometry, Kinetic | Ввод lambda встречается в photometry и kinetic контекстах. | Сведено к `SHARED-INPUT`. | Принято как shared-input при сохранении контекста возврата. |
| `1-5-1-1-2` | Photometry, Quantitative, Kinetic | Подтвержденное значение lambda переиспользовано в нескольких режимах. | Сведено к `SHARED-INPUT`. | Принято как shared-input, но требуется контекст режима. |
| `1-5-1-1-3` | Photometry, Quantitative, Kinetic | Экран "Установка lambda" имеет разные заголовки режима: фотометрия, количественный анализ, кинетика. | Отдельного `state.screen` нет; описано как runtime busy state. | Открыто. Нужен либо `SHARED-BUSY-WAVELENGTH`, либо явная документация busy-state без screen id. |
| `1-5-1-8` | Photometry, Kinetic | В обоих файлах это выбор места сохранения, но сценарии и расширения файлов разные. | В `SCREEN-SPECIFICATION` указан как `PHOT-GRAPH`, что не соответствует содержанию первичных `.txt`; runtime также имеет `FILE-*`. | Конфликт спецификации. Нужна проверка назначения `PHOT-GRAPH` и FILE-сценария. |
| `1-5-1-9` | Photometry, Kinetic | Ввод имени файла: `.bas` в photometry, `.kin` в kinetic. | В `SCREEN-SPECIFICATION` указан как `PHOT-GRAPH`; runtime также имеет `FILE-SAVE`. | Конфликт спецификации. Нужна нормализация как file-save/input с контекстом расширения. |
| `1-6-1` | Quantitative | Один ID используется для главного меню quantitative, подменю коэффициентов, ввода коэффициентов, обработки результатов/погрешности. | Разнесено на `QUANT-MAIN`, `QUANT-UNITS`, `QUANT-COEF`, все `sourceIntegrity=ambiguous`. | Открыто. Разнесение canonical ID корректно, но первичный ID остается неоднозначным. |
| `1-6-1-1-27` | Quantitative, Kinetic | В quantitative это итог/журнал градуировки; в kinetic тот же ID используется для run/graph и file list states. | `QUANT-CAL-JOURNAL`, `KIN-RUN`, `KIN-GRAPH`, `sourceIntegrity=ambiguous`. | Открыто. Нужен контекст файла/режима при трассировке. |
| `1-6-1-1-32` | Quantitative | Используется в quantitative как экран числа параллелей для анализа растворов и одновременно включен в `QUANT-COEF`/`QUANT-CAL-GRAPH`. | В `screens.json` входит в `QUANT-COEF` и `QUANT-CAL-GRAPH`; HTML-спецификация отмечает пересечение. | Открыто. Нужна ручная проверка: это coefficient flow, graph flow или отдельный setup для анализа растворов. |
| `1-6-1-1-33` | Quantitative | Аналогично `1-6-1-1-32`, экран подтвержденного числа параллелей. | В `screens.json` входит в `QUANT-COEF` и `QUANT-CAL-GRAPH`. | Открыто. |
| `1-6-1-1-34` | Quantitative | Аналогично `1-6-1-1-32`, переход к измерению растворов. | В `screens.json` входит в `QUANT-COEF` и `QUANT-CAL-GRAPH`. | Открыто. |
| `1-5` | Settings | В settings рядом с повторяющимся `1-4` появляется отдельный `1-5` для результата/ошибки калибровки lambda. | `SET-MAIN` и `SET-VERSION` включают `1-5`, но отдельного canonical ID нет. | Открыто. Нужен отдельный settings calibration result/error screen. |

## Пробелы покрытия первичных `.txt` в спецификации

| Source ID | Источник | Смысл по первичной карте | Текущее состояние | Риск |
| --- | --- | --- | --- | --- |
| `1-5-1-2-2` | Photometry | Ввод/подтверждение числа параллельных измерений. | Нет в `screens.json.sourceScreenIds`; нет в `SCREEN-SPECIFICATION` как source ID. | Потерянный параметрический экран photometry. |
| `1-5-1-6` | Photometry | Экран обнуления перед серией измерений. | Нет в `screens.json.sourceScreenIds`; нет в `SCREEN-SPECIFICATION` как source ID. | Потерянный этап zero workflow. |
| `1-5-1-7` | Photometry | Журнал/таблица параллельных измерений с накоплением строк. | Нет в `screens.json.sourceScreenIds`; нет в `SCREEN-SPECIFICATION` как source ID. | Потерянный measurement journal photometry. |

## Runtime-only области

| Область | Runtime canonical ID | Наблюдение | Статус |
| --- | --- | --- | --- |
| MultiWave | `MW-*` | Реализовано в runtime и HTML-спецификациях, но отдельного source `.txt` уровня 1 нет. | `runtime-only`; не может считаться подтвержденным первичными картами. |
| File manager | `FILE-*` | Реализован в runtime. В `.txt` есть file-сценарии внутри photometry/kinetic, но нет отдельной файловой карты. | `runtime-only`; частично пересекается с `1-5-1-8`/`1-5-1-9`. |
| Warning/shared busy | `SHARED-WARNING`, busy states | Runtime покрывает предупреждения и занятость, но первичные `.txt` часто описывают их как обычные Screen ID режима. | Требуется явное правило трассировки shared/busy экранов. |
| LCD glyph renderer | `lcd-glyph-simulator/*` | Автономный renderer использует glyph spec v2.2 и framebuffer export, но не связан с `screens.json` и не описывает screen-flow. | `implementation/prototype-only`; может проверять отображение, но не должен разрешать конфликты `Screen ID`. |

## Расхождения спецификации с первичными источниками

| Артефакт | Расхождение | Комментарий |
| --- | --- | --- |
| `src/domain/constants/screens.json` | Не содержит `1-5-1-2-2`, `1-5-1-6`, `1-5-1-7` в `sourceScreenIds`. | Это не конфликт между `.txt`, а пробел нормализации. |
| `SCREEN-SPECIFICATION-ECROS-5400UV-RU.md` | `PHOT-GRAPH` привязан к `1-5-1-8`, `1-5-1-9`, хотя первичные photometry/kinetic карты описывают там file-save flow. | Вероятно, `PHOT-GRAPH` должен иметь другой источник или `1-5-1-8`/`1-5-1-9` должны быть перенесены к `FILE-*`/`FILE-SAVE`. |
| `SCREEN-SPECIFICATION-ECROS-5400UV-RU.md` | Матрица расхождений не фиксирует пропущенные photometry ID `1-5-1-2-2`, `1-5-1-6`, `1-5-1-7`. | Нужно добавить при следующей генерации/нормализации. |
| `screenmap-ru.html` и `SCREEN-LCD-SPECIFICATION-ECROS-5400UV-RU.html` | Следуют текущему `screens.json`; поэтому наследуют пропуски source coverage. | Исправлять после обновления registry/source model, не вручную в HTML. |
| `docs/specifications/generated/screen-lcd-spec-data-ru.json` | Содержит mojibake в русских labels/lcdRows при чтении как UTF-8. | Generated LCD data нельзя считать надежным текстовым источником без проверки кодировки генератора. |
| `lcd-glyph-simulator/glyphs.compiled.json` | Не конфликтует со screen-map ID, но фиксирует неполное покрытие символов для LCD-строк и 25 размерных диагностик. | Добавить отдельный glyph-аудит к процедуре генерации LCD-спецификаций. |

## Рекомендации к следующему шагу

1. Добавить в модель отдельные canonical ID для photometry parameter/zero/journal:
   - `PHOT-PARALLELS`
   - `PHOT-ZERO`
   - `PHOT-JOURNAL`
2. Пересмотреть `PHOT-GRAPH`: текущие source ID `1-5-1-8`, `1-5-1-9` по первичным картам относятся к сохранению файла.
3. Разложить settings flow из `1-4` на отдельные canonical ID: lamp toggles, lamp warmup, dark current, lamp switch lambda input, lambda calibration result/error, date/time.
4. Для `1-6-1-1-32` ... `1-6-1-1-34` определить единственный canonical смысл или явно пометить как конфликтную связку `QUANT-COEF`/`QUANT-CAL-GRAPH`.
5. Оставить `REGISTRY_AUDIT.md` как generated/derived и переносить исправления туда только через нормализующий генератор или отдельную процедуру аудита.
6. Перед использованием `lcd-glyph-simulator` как визуального эталона исправить mojibake в `app.js` и проверить кодировку generated LCD JSON.
7. В LCD-рендеринге использовать `actualWidth`, `actualHeight` и `maxActualHeight` из `glyphs.compiled.json`; не полагаться только на номинальные размеры.
8. Для экранов с заглавными русскими строками закрепить 8 px как основной вариант или описать правило преобразования/замены для 5/6 px.
