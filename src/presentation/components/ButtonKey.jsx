import React from "react";

export function ButtonKey({ label, sublabel, onClick, className = "", tall = false }) {
  return (
    <button
      onClick={onClick}
      className={`select-none rounded-2xl border border-zinc-300 bg-zinc-100 px-3 py-2 text-center font-semibold text-emerald-700 shadow-sm transition hover:translate-y-[1px] hover:bg-white ${tall ? "min-h-[64px]" : "min-h-[52px]"} ${className}`}
    >
      <div className="text-sm leading-tight">{label}</div>
      {sublabel ? <div className="text-[10px] leading-tight opacity-80">{sublabel}</div> : null}
    </button>
  );
}
