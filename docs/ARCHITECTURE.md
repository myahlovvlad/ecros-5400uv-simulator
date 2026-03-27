# Архитектура проекта

## Общая схема

Проект разделён на четыре слоя:

- `domain` — измерительная модель, константы, проверки и чистые функции
- `application` — сценарии работы прибора и обработчики экранов
- `infrastructure` — адаптеры рендеринга и окружения
- `presentation` — React UI, контексты и пользовательские инструменты

Такое разделение позволяет отдельно развивать модель прибора, интерфейс и интеграционные части без лишней связности.

## Структура директорий

```text
src/
  domain/
    constants/
    entities/
    usecases/
  application/
    ports/
    services/
  infrastructure/
    adapters/
  presentation/
    components/
    contexts/
    hooks/
```

## Domain Layer

Слой `domain` не должен зависеть от React и браузерного окружения.

### Что находится в слое

- параметры прибора и меню
- модель измерений и расчётов
- генерация плана градуировки
- валидация имени файла и числовых параметров
- формирование стартового состояния прибора

### Ключевые файлы

- `src/domain/constants/index.js`
- `src/domain/usecases/index.js`
- `src/domain/usecases/utils.js`

## Application Layer

Слой `application` координирует бизнес-логику и реакции на действия пользователя.

### Задачи слоя

- запуск измерений и калибровок
- работа с файлами и USB-preview
- маршрутизация действий по экранам
- CLI-команды

### Ключевые файлы

- `src/application/services/DeviceService.js`
- `src/application/services/ScreenHandlers.js`
- `src/application/services/CliService.js`

## Infrastructure Layer

Слой `infrastructure` содержит адаптеры, которые переводят данные домена в конкретные форматы.

### Что здесь важно

- генерация строк LCD по текущему состоянию прибора
- in-memory и local-storage адаптеры
- логирование

### Ключевые файлы

- `src/infrastructure/adapters/LcdRenderer.js`
- `src/infrastructure/adapters/MemoryStorage.js`
- `src/infrastructure/adapters/LocalStorageAdapter.js`

## Presentation Layer

Слой `presentation` отвечает за web-интерфейс симулятора.

### Основные элементы

- интерактивная панель прибора
- bitmap LCD с графиками
- редактор подписей панели
- редактор строк LCD
- боковые панели состояния, CLI и USB-экспорта

### Ключевые файлы

- `src/presentation/components/Ecros5400UvSimulator.jsx`
- `src/presentation/components/InstrumentPanel.jsx`
- `src/presentation/components/LcdCanvas.jsx`
- `src/presentation/components/PanelLabelEditor.jsx`
- `src/presentation/components/LcdTextEditor.jsx`
- `src/presentation/hooks/useDeviceController.js`

## Поток данных

Сценарий работы в интерфейсе выглядит так:

1. Пользователь нажимает кнопку панели или клавишу клавиатуры.
2. `useDeviceController` принимает действие и передаёт его в нужный screen handler.
3. Screen handler вызывает методы `DeviceService` или меняет состояние напрямую, если операция тривиальна.
4. `LcdRenderer` пересчитывает строки LCD по новому состоянию.
5. `LcdCanvas` отображает их как bitmap-глифы либо строит график.

## Принципы изменений

При дальнейшем развитии проекта стоит сохранять несколько правил:

- новые вычисления и проверки добавлять сначала в `domain`
- сценарии работы прибора размещать в `application/services`
- не смешивать UI-логику и измерительную модель
- пользовательские редакторы и инструменты держать в `presentation/components`

## Отдельные артефакты

Референс-материалы хранятся в `docs/` и не являются частью runtime:

- спецификация глифов LCD
- технические прототипы
- фото и исходные материалы панели
