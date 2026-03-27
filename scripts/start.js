#!/usr/bin/env node

import { spawn } from "child_process";
import { platform } from "os";

const PORT = process.env.PORT || 3000;
const command = platform() === "win32" ? "npm.cmd" : "npm";
const args = ["run", "dev"];

console.log(`Starting ECROS-5400UV Simulator on port ${PORT}...`);

const child = spawn(command, args, {
  stdio: "inherit",
  shell: false,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error("Failed to start dev server:", error.message);
  process.exit(1);
});
