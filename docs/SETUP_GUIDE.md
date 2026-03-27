# Руководство по запуску

## Требования

- Node.js `18+`
- npm
- доступ к GitHub, если нужен `push`

## Установка зависимостей

```bash
npm install
```

## Локальный запуск

```bash
npm run dev
```

Адрес по умолчанию:

```text
http://127.0.0.1:3000
```

## Сборка

```bash
npm run build
```

## Тесты

```bash
npm test -- --run
```

## Windows

Для локального старта также можно использовать:

```bat
init.bat
```

Скрипт запускает `npm.cmd` и не использует проблемные batch-конструкции с битой кодировкой.

## Частые проблемы

### `ERR_CONNECTION_REFUSED`

Проверьте, что dev-сервер действительно поднят:

```bash
npm run dev
```

В проекте зафиксированы:

- `host: 127.0.0.1`
- `port: 3000`
- `strictPort: true`

### Страница выглядит как сырой HTML

Проверьте, что загружается `src/styles.css` через `main.jsx`.

### Ошибки TypeScript по `tsconfig.node.json`

В конфиге должен быть включён `noEmit`, чтобы TypeScript не пытался перезаписать входные конфиги.

## Рекомендуемый рабочий цикл

1. `npm install`
2. `npm run dev`
3. `npm test -- --run`
4. `npm run build`
5. `git status`
