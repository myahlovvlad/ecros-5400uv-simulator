import React from "react";
import { ButtonKey } from "./ButtonKey.jsx";

const PANEL_DIGITS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["0", ".", "-"],
];

const SUBLABELS = {
  "2": "ABC",
  "3": "DEF",
  "4": "GHI",
  "5": "JKL",
  "6": "MNO",
  "7": "PQRS",
  "8": "TUV",
  "9": "WXYZ",
};

export function DevicePanel({ onAction }) {
  const getActionLabel = (rowIndex) => {
    if (rowIndex === 0) return "ПЕРЕХОД λ";
    if (rowIndex === 1) return "НОЛЬ";
    if (rowIndex === 2) return "START";
    return "ВВОД";
  };

  const getAction = (rowIndex) => {
    if (rowIndex === 0) return "GOTOО»";
    if (rowIndex === 1) return "ZERO";
    if (rowIndex === 2) return "START/STOP";
    return "ENTER";
  };

  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_120px_1fr] gap-3">
      <ButtonKey label="ФАЙЛ" onClick={() => onAction("FILE")} />
      <ButtonKey label="ОЧИСТИТЬ" onClick={() => onAction("CLEAR")} />
      <ButtonKey label="ПЕЧАТЬ" onClick={() => onAction("PRINT")} />

      <div className="row-span-5 flex flex-col items-center justify-center gap-3">
        <button onClick={() => onAction("UP")} className="flex h-16 w-16 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-2xl text-emerald-700 shadow-sm">▲</button>
        <button onClick={() => onAction("DOWN")} className="flex h-16 w-16 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-2xl text-emerald-700 shadow-sm">▼</button>
        <button onClick={() => onAction("ESC")} className="flex min-h-[56px] min-w-[78px] items-center justify-center rounded-2xl border border-zinc-300 bg-zinc-100 px-3 py-2 font-semibold text-emerald-700 shadow-sm">ESC</button>
      </div>

      <ButtonKey label="ПАРАМЕТРЫ" onClick={() => onAction("SET")} />

      {PANEL_DIGITS.map((row, rowIndex) => (
        <React.Fragment key={rowIndex}>
          {row.map((digit) => (
            <ButtonKey key={digit} label={digit} sublabel={SUBLABELS[digit] || ""} onClick={() => onAction(digit)} />
          ))}
          <ButtonKey
            label={getActionLabel(rowIndex)}
            onClick={() => onAction(getAction(rowIndex))}
            className={rowIndex === 2 ? "text-[13px]" : ""}
            tall={rowIndex === 2}
          />
        </React.Fragment>
      ))}
    </div>
  );
}
