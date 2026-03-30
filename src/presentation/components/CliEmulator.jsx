import React, { useState } from "react";

const QUICK_COMMANDS = ["help", "rezero", "getdark", "resetdark", "ge 2", "swl 300", "getwl", "ga", "getsoftver", "adjustwl", "diag"];

export function CliEmulator({ logLines, onExecute }) {
  const [cliValue, setCliValue] = useState("help");

  const execute = () => onExecute(cliValue);

  return (
    <div data-testid="cli-emulator" className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">CLI-эмулятор</h2>
      <div className="mb-3 rounded-2xl bg-zinc-950 p-3 font-mono text-xs text-emerald-300">
        <div className="mb-2 h-[260px] overflow-auto whitespace-pre-wrap break-words">
          {logLines.map((line, index) => <div key={`${line}-${index}`}>{line || " "}</div>)}
        </div>
        <div className="flex gap-2">
          <input
            data-testid="cli-input"
            value={cliValue}
            onChange={(event) => setCliValue(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") execute(); }}
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-emerald-200 outline-none"
            placeholder="Например: rezero или swl 500"
          />
          <button
            type="button"
            data-testid="cli-submit"
            onClick={execute}
            className="rounded-xl bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
          >
            Отправить
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {QUICK_COMMANDS.map((command) => (
          <button
            key={command}
            type="button"
            data-testid={`cli-quick-${command.replace(/\s+/g, "-")}`}
            onClick={() => {
              setCliValue(command);
              onExecute(command);
            }}
            className="rounded-full border border-zinc-300 px-3 py-1 hover:bg-zinc-50"
          >
            {command}
          </button>
        ))}
      </div>
    </div>
  );
}
