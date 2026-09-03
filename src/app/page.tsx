"use client";

import { useMemo, useState } from "react";
import {
  feetAndInches,
  formatMm,
  inchesToMm,
  mmToTape,
  parseLength,
  parseMm,
} from "@/lib/convert";

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

const CONVERSION_TABLE = [
  { inches: 1.5, label: `1 1/2"` },
  { inches: 3.5, label: `3 1/2"` },
  { inches: 120, label: `120"` },
  { inches: 240, label: `240"` },
];

const DIMENSION_TABLE: { inches: [number, number]; label: string }[] = [
  { inches: [3, 3.5], label: `3" x 3 1/2"` },
  { inches: [3.5, 5.5], label: `3 1/2" x 5 1/2"` },
  { inches: [5.5, 1.5], label: `5 1/2" x 1 1/2"` },
];

type Mode = "toMm" | "toIn" | "table";

export default function Home() {
  const [mode, setMode] = useState<Mode>("toMm");
  const [input, setInput] = useState("");

  const toMm = mode === "toMm";
  const isTable = mode === "table";
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", toMm ? "/" : ".", "0", "⌫"];

  const imperial = useMemo(
    () => (toMm ? parseLength(input) : null),
    [toMm, input]
  );
  const metric = useMemo(() => (toMm ? null : parseMm(input)), [toMm, input]);
  const tape = useMemo(
    () => (metric !== null ? mmToTape(metric, 8) : null),
    [metric]
  );
  const feet = useMemo(
    () => (tape && tape.whole >= 12 ? feetAndInches(tape) : null),
    [tape]
  );

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setInput("");
  }

  function pressKey(key: string) {
    if (key === "⌫") {
      setInput((prev) => prev.slice(0, -1));
      return;
    }
    // only one decimal point in mm mode
    if (key === "." && input.includes(".")) return;
    setInput((prev) => prev + key);
  }

  function pressSpace() {
    setInput((prev) => (prev.endsWith(" ") || prev === "" ? prev : prev + " "));
  }

  function pressChip(chip: string) {
    setInput((prev) => {
      const trimmed = prev.trimEnd();
      return trimmed ? `${trimmed} ${chip}` : chip;
    });
  }

  const tabClass = (active: boolean) =>
    `flex-1 rounded-lg py-2.5 text-sm font-bold transition ${
      active
        ? "bg-accent-dark text-white"
        : "text-accent/70 active:bg-surface-2"
    }`;

  return (
    <div className="flex min-h-dvh flex-col bg-background px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <header className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-base font-black leading-tight tracking-tight text-foreground">
            Measure
          </h1>
          <p className="text-[10px] leading-tight text-foreground/40">
            Made by Kirk for Triumph
          </p>
        </div>
        <div className="flex items-stretch gap-1 rounded-xl border border-foreground/10 bg-surface p-0.5">
          <button onClick={() => switchMode("toMm")} className={tabClass(toMm)}>
            <span className="px-2">in → mm</span>
          </button>
          <div className="my-1.5 w-px bg-foreground/10" />
          <button onClick={() => switchMode("toIn")} className={tabClass(mode === "toIn")}>
            <span className="px-2">mm → in</span>
          </button>
          <div className="my-1.5 w-px bg-foreground/10" />
          <button onClick={() => switchMode("table")} className={tabClass(isTable)}>
            <span className="px-2">Conversions</span>
          </button>
        </div>
      </header>

      {isTable ? (
        <div className="flex flex-col gap-2">
          <div className="rounded-2xl border border-foreground/10 bg-surface shadow-sm">
            <div className="flex items-center justify-between px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-foreground/40">
              <span>Inches</span>
              <span>Millimetres</span>
            </div>
            {CONVERSION_TABLE.map((row, i) => (
              <div
                key={row.label}
                className={`flex items-center justify-between px-4 py-3 ${
                  i > 0 ? "border-t border-foreground/10" : ""
                }`}
              >
                <span className="text-lg font-bold tabular-nums text-foreground">
                  {row.label}
                </span>
                <span className="text-lg font-black tabular-nums text-accent">
                  {formatMm(inchesToMm(row.inches))} mm
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-foreground/10 bg-surface shadow-sm">
            <div className="flex items-center justify-between px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-foreground/40">
              <span>Millimetres</span>
              <span>Dimensions</span>
            </div>
            {DIMENSION_TABLE.map((row, i) => (
              <div
                key={row.label}
                className={`flex items-center justify-between px-4 py-3 ${
                  i > 0 ? "border-t border-foreground/10" : ""
                }`}
              >
                <span className="text-lg font-black tabular-nums text-accent">
                  {row.inches.map((n) => formatMm(inchesToMm(n))).join(" x ")} mm
                </span>
                <span className="text-lg font-bold tabular-nums text-foreground">
                  {row.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
      <div className="mb-2 rounded-2xl border border-foreground/10 bg-surface px-4 py-3 shadow-sm">
        <div className="flex min-h-[1.5rem] items-center justify-center text-base font-medium text-foreground/60">
          {input ? (
            <span>
              {input}
              <span className="text-foreground/30">{toMm ? "″" : " mm"}</span>
            </span>
          ) : (
            <span className="text-foreground/30">
              {toMm ? "e.g. 24 1/8" : "e.g. 600"}
            </span>
          )}
        </div>

        <div className="flex items-baseline justify-center gap-1.5 pt-0.5">
          {toMm ? (
            <>
              <span className="text-5xl font-black tabular-nums leading-none text-foreground">
                {imperial ? formatMm(imperial.mm) : "—"}
              </span>
              <span className="text-lg font-bold text-accent">mm</span>
            </>
          ) : (
            <span className="text-5xl font-black tabular-nums leading-none text-foreground">
              {tape ? tape.label : "—"}
            </span>
          )}
        </div>

        <div className="pt-1 text-center text-[11px] leading-tight text-foreground/40">
          {!toMm && tape
            ? Math.abs(tape.deltaMm) < 0.005
              ? "exact"
              : `nearest 1/8 · mark = ${formatMm(tape.markMm)}mm`
            : " "}
        </div>
      </div>

      {!toMm && feet && (
        <div className="mb-2 rounded-2xl border border-accent/20 bg-surface-2 px-4 py-2 text-center shadow-sm">
          <span className="text-xl font-black tabular-nums text-accent">
            {feet}
          </span>
          <span className="pl-1.5 text-[10px] font-medium text-accent/60">
            ft / in
          </span>
        </div>
      )}

      {toMm && (
        <div className="mb-2 grid grid-cols-5 gap-2">
          {FRACTION_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => pressChip(chip)}
              className="rounded-xl border border-accent/25 bg-surface-2 py-3 text-sm font-semibold text-accent transition active:scale-95 active:bg-accent-dark active:text-white"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      <div className="mt-auto grid grid-cols-3 gap-1.5">
        {keys.map((key) => (
          <button
            key={key}
            onClick={() => pressKey(key)}
            className="rounded-xl border border-foreground/15 bg-surface py-3 text-xl font-bold text-foreground transition active:scale-95 active:bg-surface-2"
          >
            {key}
          </button>
        ))}
        {toMm ? (
          <button
            onClick={pressSpace}
            className="col-span-2 rounded-xl border border-foreground/15 bg-surface py-3 text-base font-bold text-foreground transition active:scale-95 active:bg-surface-2"
          >
            space
          </button>
        ) : null}
        <button
          onClick={() => setInput("")}
          className={`${
            toMm ? "" : "col-span-3"
          } rounded-xl border border-accent/40 bg-accent-dark/10 py-4 text-base font-bold text-accent transition active:scale-95 active:bg-accent-dark active:text-white`}
        >
          clear
        </button>
      </div>
        </>
      )}
    </div>
  );
}
