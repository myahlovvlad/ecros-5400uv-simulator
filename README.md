# ЭКРОС-5400УФ Simulator

Веб-симулятор спектрофотометра ЭКРОС-5400УФ с интерактивной панелью управления, bitmap-LCD 128x64, CLI-эмулятором, файловыми операциями, USB-экспортом и визуальным редактором подписей панели и дисплея.

## Что есть в проекте

- нативный web-макет панели прибора без фоновой фотографии
- bitmap-рендер LCD по глифовой спецификации `docs/glyph-specification-lcd-128x64-v2.2.md`
- режимы фотометрии, количественного анализа, кинетики и настроек
- виртуальные образцы и модель измерений
- файловый менеджер, журнал градуировки и USB-preview
- CLI-эмулятор команд оригинального прибора
- редактор подписей панели с генерацией C-кода
- редактор строк LCD для ручного визуального предпросмотра

## Быстрый старт

### Требования

- Node.js `18+`
- npm
- Windows, macOS или Linux

### Установка

```bash
npm install
```

### Запуск разработки

```bash
npm run dev
```

По умолчанию приложение доступно по адресу:

```text
http://127.0.0.1:3000
```

### Production-сборка

```bash
npm run build
```

### Тесты

```bash
npm test
```

## Управление

### Клавиатура

| Клавиша | Действие |
| --- | --- |
| `ArrowUp`, `ArrowDown` | Навигация по меню |
| `Enter` | Подтверждение |
| `Escape` | Назад / отмена |
| `0-9` | Ввод цифр |
| `.` `-` `_` | Спецсимволы для ввода |

### Кнопки панели

| Кнопка | Действие |
| --- | --- |
| `ФАЙЛ` | Файловый менеджер или сохранение |
| `ОЧИСТИТЬ` | Удаление последнего результата или символа |
| `ПЕЧАТЬ` | Зарезервирована |
| `ПАРАМЕТРЫ` | Выбор параметра / меню |
| `ПЕРЕХОД Λ` | Ввод длины волны |
| `НОЛЬ` | Калибровка нуля |
| `START / СТОП` | Измерение или запуск/остановка кинетики |
| `ВВОД` | Подтверждение |

## Структура проекта

```text
src/
  domain/            Бизнес-правила и константы
  application/       Сервисный слой и обработчики экранов
  infrastructure/    LCD-рендерер и адаптеры
  presentation/      React-компоненты, контексты и хуки
tests/
docs/
```

Подробности:

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)
- [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md)
- [docs/api/README.md](docs/api/README.md)
- [docs/business-logic/README.md](docs/business-logic/README.md)

## Основные компоненты

- `src/presentation/components/InstrumentPanel.jsx` — интерактивная панель прибора
- `src/presentation/components/LcdCanvas.jsx` — bitmap LCD и графики
- `src/presentation/components/PanelLabelEditor.jsx` — редактор подписей панели и генератор C-кода
- `src/presentation/components/LcdTextEditor.jsx` — ручной редактор строк LCD
- `src/presentation/hooks/useDeviceController.js` — центральная логика управления состоянием
- `src/infrastructure/adapters/LcdRenderer.js` — формирование строк LCD

## Текущее состояние

Проект опубликован в GitHub и содержит:

- рабочий `main`
- тег релиза `v2.0.0`
- тесты доменного и сервисного слоя

## Лицензия

MIT
