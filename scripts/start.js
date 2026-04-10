#!/usr/bin/env node

/**
 * Скрипт запуска сервера разработки ECROS-5400UV Simulator
 * Определяет ОС и запускает соответствующую команду npm run dev
 */

import { spawn } from "child_process";
import { platform } from "os";

// Порт по умолчанию для сервера разработки
const PORT = process.env.PORT || 3000;
// Определяем команду запуска в зависимости от ОС (npm.cmd для Windows, npm для Unix)
const command = platform() === "win32" ? "npm.cmd" : "npm";
const args = ["run", "dev"];

console.log(`Starting ECROS-5400UV Simulator on port ${PORT}...`);

// Запускаем дочерний процесс с наследованием стандартных потоков
const child = spawn(command, args, {
  stdio: "inherit",
  shell: false,
});

// Обработчик завершения дочернего процесса
child.on("exit", (code) => {
  process.exit(code ?? 0);
});

// Обработчик ошибок запуска
child.on("error", (error) => {
  console.error("Failed to start dev server:", error.message);
  process.exit(1);
});
