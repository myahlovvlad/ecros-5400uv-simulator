# LCD Glyph Audit

Версия: draft 2026-04-15

## Источники аудита

- Runtime LCD rows из `src/infrastructure/adapters/LcdRenderer.js`
- Screen registry из `src/domain/constants/screens.json`
- Текущая bitmap-карта `FONT_BITMAP` из `src/presentation/utils/lcdBitmap.js`
- Спецификация `docs/glyph-specification-lcd-128x64-v2.2.md`

## Итог

| Проверка | Результат |
| --- | --- |
| Символов требуется runtime/spec registry | 130 |
| Символов описано в glyph specification headings | 138 |
| Символов есть в текущем `FONT_BITMAP` | 145 |
| Обязательные runtime символы без глифа | 0 |
| Символы из glyph specification без реализации | 0 |
| Реализованные символы вне glyph specification | 7 |
| Runtime rows с переполнением LCD ширины | 0 |

## Отсутствующие обязательные runtime символы

-

## Символы из glyph specification, которых нет в FONT_BITMAP

-

## Реализованные символы вне glyph specification

`space`, `_`, `;`, `?`, `[`, `]`, `Λ`

## Широкие глифы текущей реализации

Эти глифы шире 5 px. Это не ошибка само по себе, но для LCD 128x64 их нужно явно учитывать при строках с кириллицей и меню.

| Символ | Ширина | Высота |
| --- | ---: | ---: |
| `Д` | 7 | 8 |
| `Ж` | 7 | 8 |
| `М` | 7 | 8 |
| `Ф` | 7 | 8 |
| `Ш` | 7 | 8 |
| `Щ` | 7 | 8 |
| `Ы` | 7 | 8 |
| `Ю` | 7 | 8 |
| `M` | 7 | 8 |
| `№` | 7 | 8 |
| `W` | 7 | 8 |
| `д` | 6 | 8 |
| `Ц` | 6 | 8 |
| `Ъ` | 6 | 8 |
| `ю` | 6 | 8 |

## Переполнение строк LCD

| Screen | Row | Width | Text |
| --- | ---: | ---: | --- |
| - | - | - | - |

## Вывод для переработки

1. Текущий `FONT_BITMAP` уже покрывает основной runtime-набор кириллицы, латиницы, цифр и служебных символов.
2. Следующая переработка должна не просто добавлять символы, а привести размеры и формы к `glyph-specification-lcd-128x64-v2.2.md`.
3. Нужно вынести глифы из `lcdBitmap.js` в отдельный glyph-pack модуль и оставить renderer только за отрисовку.
4. После выноса glyph-pack добавить тесты: покрытие обязательных runtime symbols, соответствие высоты 8 px, отсутствие fallback glyph на экранах registry.
