import { parseLength, formatMm } from "../src/lib/convert.ts";

/**
 * Independent oracle: exact rational arithmetic with BigInt, no floats anywhere.
 *
 * For W inches + n/16:  mm = (16W + n) * 254 / 160
 * Scaled by 100 for 2dp:  (16W + n) * 635 / 4
 * Half-up round of a/b (positive): floor((2a + b) / (2b))
 */
function exactMmString(whole: bigint, sixteenths: bigint): string {
  const a = (16n * whole + sixteenths) * 635n;
  const b = 4n;
  const scaled = (2n * a + b) / (2n * b); // hundredths of a mm, half-up
  const intPart = scaled / 100n;
  const frac = scaled % 100n;
  if (frac === 0n) return intPart.toString();
  if (frac % 10n === 0n) return `${intPart}.${(frac / 10n).toString()}`;
  return `${intPart}.${frac.toString().padStart(2, "0")}`;
}

const FRACTION_NAMES: Record<number, string> = {
  0: "", 1: "1/16", 2: "1/8", 3: "3/16", 4: "1/4", 5: "5/16", 6: "3/8",
  7: "7/16", 8: "1/2", 9: "9/16", 10: "5/8", 11: "11/16", 12: "3/4",
  13: "13/16", 14: "7/8", 15: "15/16",
};

let checked = 0;
const mismatches: string[] = [];

// Every 1/16" from 0" to 120" (a 10-foot tape) — 1921 readings
for (let w = 0; w <= 120; w++) {
  for (let n = 0; n <= 15; n++) {
    const frac = FRACTION_NAMES[n];
    const input = frac ? (w === 0 ? frac : `${w} ${frac}`) : `${w}`;
    const parsed = parseLength(input);
    if (!parsed) {
      mismatches.push(`${input} -> FAILED TO PARSE`);
      continue;
    }
    const got = formatMm(parsed.mm);
    const want = exactMmString(BigInt(w), BigInt(n));
    checked++;
    if (got !== want) mismatches.push(`${input.padEnd(12)} got ${got}  want ${want}`);
  }
}

console.log(`Checked ${checked} tape readings (0" to 120", every 1/16")`);
console.log(`Mismatches: ${mismatches.length}`);
for (const m of mismatches.slice(0, 40)) console.log("  " + m);
if (mismatches.length > 40) console.log(`  ...and ${mismatches.length - 40} more`);

// Spot-check a few against known reference values
console.log("\nReference spot-checks:");
const refs: [string, string][] = [
  ["1", "25.4"],
  ["12", "304.8"],
  ["1/2", "12.7"],
  ["1/4", "6.35"],
  ["1/16", "1.5875"],
  ["3/8", "9.525"],
  ["24 1/8", "612.775"],
  ["39 3/8", "1000.125"],
];
for (const [input, exact] of refs) {
  const r = parseLength(input)!;
  console.log(
    `  ${input.padEnd(10)} exact ${exact.padEnd(10)} app shows ${formatMm(r.mm)}`
  );
}
