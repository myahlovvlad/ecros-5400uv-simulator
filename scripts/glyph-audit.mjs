import fs from "node:fs/promises";
import path from "node:path";
import {
  FILE_ACTIONS,
  FILE_GROUPS,
  MENU_KINETICS,
  MENU_MAIN,
  MENU_MULTI_WAVE,
  MENU_PHOTOMETRY_VALUE,
  MENU_QUANT,
  MENU_SETTINGS,
  SAMPLE_OPTIONS,
  UNITS,
} from "../src/domain/constants/index.js";
import { initialDevice } from "../src/domain/usecases/index.js";
import { getLcdRows } from "../src/infrastructure/adapters/LcdRenderer.js";
import {
  FONT_BITMAP,
  LCD_TEXT_MAX_WIDTH,
  measureRows,
  normalizeFontChar,
} from "../src/presentation/utils/lcdBitmap.js";

const GLYPH_SPEC_PATH = "docs/glyph-specification-lcd-128x64-v2.2.md";
const OUTPUT_PATH = "docs/specifications/LCD-GLYPH-AUDIT-RU.md";
const JSON_OUTPUT_PATH = "artifacts/lcd-audit/glyph-audit.json";

const screensData = JSON.parse(await fs.readFile("src/domain/constants/screens.json", "utf8"));
const SCREEN_REGISTRY = Object.fromEntries(screensData.map((screen) => [screen.id, screen]));

function addTextChars(target, text) {
  Array.from(String(text ?? "")).forEach((char) => {
    if (char.trim() || char === " ") target.add(char);
  });
}

function collectRegistryText(chars) {
  Object.values(SCREEN_REGISTRY).forEach((screen) => {
    addTextChars(chars, screen.title);
    addTextChars(chars, screen.canonicalId);
    addTextChars(chars, screen.legacyWnd);
    screen.sourceScreenIds.forEach((id) => addTextChars(chars, id));
    screen.fields.forEach((field) => addTextChars(chars, field));
    screen.transitions.forEach((transition) => {
      addTextChars(chars, transition.action);
      addTextChars(chars, transition.target);
      addTextChars(chars, transition.condition);
    });
  });
}

function collectRuntimeLcdText(chars) {
  Object.keys(SCREEN_REGISTRY).forEach((screen) => {
    const device = { ...initialDevice(), screen };
    getLcdRows(device).forEach((row) => addTextChars(chars, row.text));
  });

  [
    FILE_ACTIONS,
    FILE_GROUPS,
    MENU_KINETICS,
    MENU_MAIN,
    MENU_MULTI_WAVE,
    MENU_PHOTOMETRY_VALUE,
    MENU_QUANT,
    MENU_SETTINGS,
    SAMPLE_OPTIONS.map((sample) => sample.label),
    UNITS,
  ].flat().forEach((text) => addTextChars(chars, text));
}

function collectGlyphSpecChars(specText) {
  const chars = new Set();
  const headingRe = /^###\s+(.+?)\s+\(/gmu;
  for (const match of specText.matchAll(headingRe)) {
    const token = match[1].trim();
    if (Array.from(token).length === 1) chars.add(token);
  }
  return chars;
}

function isSupported(char) {
  const normalized = normalizeFontChar(char);
  return Boolean(FONT_BITMAP[normalized]);
}

function getGlyphWidth(char) {
  const normalized = normalizeFontChar(char);
  const glyph = FONT_BITMAP[normalized];
  return glyph?.[0]?.length ?? 0;
}

function getGlyphHeight(char) {
  const normalized = normalizeFontChar(char);
  return FONT_BITMAP[normalized]?.length ?? 0;
}

function formatChars(chars) {
  if (!chars.length) return "-";
  return chars.map((char) => `\`${char === " " ? "space" : char}\``).join(", ");
}

function collectOverflowRows() {
  return Object.keys(SCREEN_REGISTRY).flatMap((screen) => {
    const rows = getLcdRows({ ...initialDevice(), screen });
    return measureRows(rows)
      .filter((row) => row.overflow)
      .map((row) => ({
        screen,
        row: row.row,
        text: row.text,
        width: row.width,
      }));
  });
}

function createMarkdown({
  requiredChars,
  specChars,
  missingRequired,
  specNotImplemented,
  implementedNotSpec,
  wideGlyphs,
  overflowRows,
}) {
  return `# LCD Glyph Audit

Версия: draft 2026-04-15

## Источники аудита

- Runtime LCD rows из \`src/infrastructure/adapters/LcdRenderer.js\`
- Screen registry из \`src/domain/constants/screens.json\`
- Текущая bitmap-карта \`FONT_BITMAP\` из \`src/presentation/utils/lcdBitmap.js\`
- Спецификация \`${GLYPH_SPEC_PATH}\`

## Итог

| Проверка | Результат |
| --- | --- |
| Символов требуется runtime/spec registry | ${requiredChars.length} |
| Символов описано в glyph specification headings | ${specChars.length} |
| Символов есть в текущем \`FONT_BITMAP\` | ${Object.keys(FONT_BITMAP).length} |
| Обязательные runtime символы без глифа | ${missingRequired.length} |
| Символы из glyph specification без реализации | ${specNotImplemented.length} |
| Реализованные символы вне glyph specification | ${implementedNotSpec.length} |
| Runtime rows с переполнением LCD ширины | ${overflowRows.length} |

## Отсутствующие обязательные runtime символы

${formatChars(missingRequired)}

## Символы из glyph specification, которых нет в FONT_BITMAP

${formatChars(specNotImplemented)}

## Реализованные символы вне glyph specification

${formatChars(implementedNotSpec)}

## Широкие глифы текущей реализации

Эти глифы шире 5 px. Это не ошибка само по себе, но для LCD 128x64 их нужно явно учитывать при строках с кириллицей и меню.

| Символ | Ширина | Высота |
| --- | ---: | ---: |
${wideGlyphs.map((item) => `| \`${item.char}\` | ${item.width} | ${item.height} |`).join("\n") || "| - | - | - |"}

## Переполнение строк LCD

| Screen | Row | Width | Text |
| --- | ---: | ---: | --- |
${overflowRows.map((row) => `| \`${row.screen}\` | ${row.row} | ${row.width}px / ${LCD_TEXT_MAX_WIDTH}px | \`${row.text}\` |`).join("\n") || "| - | - | - | - |"}

## Вывод для переработки

1. Текущий \`FONT_BITMAP\` уже покрывает основной runtime-набор кириллицы, латиницы, цифр и служебных символов.
2. Следующая переработка должна не просто добавлять символы, а привести размеры и формы к \`glyph-specification-lcd-128x64-v2.2.md\`.
3. Нужно вынести глифы из \`lcdBitmap.js\` в отдельный glyph-pack модуль и оставить renderer только за отрисовку.
4. После выноса glyph-pack добавить тесты: покрытие обязательных runtime symbols, соответствие высоты 8 px, отсутствие fallback glyph на экранах registry.
`;
}

async function main() {
  const specText = await fs.readFile(GLYPH_SPEC_PATH, "utf8");
  const requiredSet = new Set();
  collectRuntimeLcdText(requiredSet);
  collectRegistryText(requiredSet);

  const requiredChars = [...requiredSet].sort((a, b) => a.localeCompare(b, "ru"));
  const specChars = [...collectGlyphSpecChars(specText)].sort((a, b) => a.localeCompare(b, "ru"));
  const fontChars = Object.keys(FONT_BITMAP).sort((a, b) => a.localeCompare(b, "ru"));

  const missingRequired = requiredChars.filter((char) => !isSupported(char));
  const specNotImplemented = specChars.filter((char) => !isSupported(char));
  const implementedNotSpec = fontChars.filter((char) => !specChars.includes(char));
  const wideGlyphs = fontChars
    .map((char) => ({ char, width: getGlyphWidth(char), height: getGlyphHeight(char) }))
    .filter((item) => item.width > 5)
    .sort((a, b) => b.width - a.width || a.char.localeCompare(b.char, "ru"));
  const overflowRows = collectOverflowRows();

  const report = {
    requiredChars,
    specChars,
    fontChars,
    missingRequired,
    specNotImplemented,
    implementedNotSpec,
    wideGlyphs,
    overflowRows,
  };

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.mkdir(path.dirname(JSON_OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, createMarkdown(report), "utf8");
  await fs.writeFile(JSON_OUTPUT_PATH, JSON.stringify(report, null, 2), "utf8");

  console.log(`Glyph audit written to ${OUTPUT_PATH}`);
  console.log(`Missing runtime glyphs: ${missingRequired.length}`);
  console.log(`Spec glyphs not implemented: ${specNotImplemented.length}`);
  console.log(`LCD overflow rows: ${overflowRows.length}`);
}

await main();
