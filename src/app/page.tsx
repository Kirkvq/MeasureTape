"use client";

import { useMemo, useState } from "react";
import { formatMm, parseLength } from "@/lib/convert";

const FRACTION_CHIPS = [
  "1/16",
  "1/8",
  "3/16",
  "1/4",
  "5/16",
  "3/8",
  "7/16",
  "1/2",
  "9/16",
  "5/8",
  "11/16",
  "3/4",
  "13/16",
  "7/8",
  "15/16",
];

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "/", "0", "⌫"];

export default function Home() {
  const [input, setInput] = useState("");

  const result = useMemo(() => parseLength(input), [input]);

  function pressKey(key: string) {
    if (key === "⌫") {
      setInput((prev) => prev.slice(0, -1));
      return;
    }
    setInput((prev) => prev + key);
  }

  function pressSpace() {
    setInput((prev) => (prev.endsWith(" ") || prev === "" ? prev : prev + " "));
  }

  function pressChip(chip: string) {
    setInput((prev) => {
      const trimmed = prev.trimEnd();
      if (!trimmed) return chip;
      return `${trimmed} ${chip}`;
    });
  }

  function clearAll() {
    setInput("");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <header className="mb-4 text-center">
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          Measure
        </h1>
        <p className="text-xs text-accent">tape reading → mm</p>
      </header>

      <div className="mb-4 rounded-3xl bg-surface p-5 shadow-lg">
        <div className="mb-1 flex min-h-[2.25rem] items-center justify-center text-2xl font-medium text-foreground/70">
          {input ? (
            <span>
              {input}
              <span className="text-foreground/30">″</span>
            </span>
          ) : (
            <span className="text-foreground/30">e.g. 24 1/8</span>
          )}
        </div>
        <div className="flex items-baseline justify-center gap-2 py-2">
          <span className="text-6xl font-black tabular-nums text-foreground">
            {result ? formatMm(result.mm) : "—"}
          </span>
          <span className="text-2xl font-bold text-accent">mm</span>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-5 gap-2">
        {FRACTION_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => pressChip(chip)}
            className="rounded-xl bg-surface-2 py-2.5 text-sm font-semibold text-accent active:scale-95 active:bg-accent-dark active:text-white transition"
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="mt-auto grid grid-cols-3 gap-2">
        {KEYS.map((key) => (
          <button
            key={key}
            onClick={() => pressKey(key)}
            className="rounded-2xl bg-surface py-5 text-2xl font-bold text-foreground active:scale-95 active:bg-surface-2 transition"
          >
            {key}
          </button>
        ))}
        <button
          onClick={pressSpace}
          className="col-span-2 rounded-2xl bg-surface py-5 text-lg font-bold text-foreground active:scale-95 active:bg-surface-2 transition"
        >
          space
        </button>
        <button
          onClick={clearAll}
          className="rounded-2xl bg-accent-dark/40 py-5 text-lg font-bold text-accent active:scale-95 active:bg-accent-dark active:text-white transition"
        >
          clear
        </button>
      </div>
    </div>
  );
}
