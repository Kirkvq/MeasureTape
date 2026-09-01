import { mmToTape, parseLength, parseMm, formatMm } from "../src/lib/convert.ts";

let pass = 0;
let fail = 0;
const failures: string[] = [];

function eq(mm: number, expected: string, note = "") {
  const got = mmToTape(mm).label;
  if (got === expected) pass++;
  else {
    fail++;
    failures.push(`  ${String(mm).padEnd(10)} got ${got.padEnd(12)} want ${expected}  ${note}`);
  }
}

console.log("=== Exact inch marks ===");
eq(25.4, '1"');
eq(304.8, '12"');
eq(0, '0"');
eq(609.6, '24"');

console.log("=== Exact fraction marks (must reduce properly) ===");
eq(1.5875, '1/16"');
eq(3.175, '1/8"');
eq(4.7625, '3/16"');
eq(6.35, '1/4"');
eq(12.7, '1/2"');
eq(19.05, '3/4"');
eq(22.225, '7/8"');
eq(23.8125, '15/16"');
eq(612.775, '24 1/8"', "the headline case");
eq(80.9625, '3 3/16"');

console.log("=== Real mm values snapping to nearest 16th ===");
eq(600, '23 5/8"');
eq(1000, '39 3/8"');
eq(100, '3 15/16"');
eq(500, '19 11/16"');
eq(2400, '94 1/2"');
eq(50, '1 15/16"', "49.21 is closer than 50.8");

console.log("=== Rounding boundaries (1/16 = 1.5875mm, midpoint 0.79375) ===");
eq(1.58, '1/16"', "just under a full 1/16");
eq(0.79, '0"', "just below midpoint -> down");
eq(0.79375, '1/16"', "exact midpoint -> half-up");
eq(0.8, '1/16"', "just above midpoint -> up");
eq(0.5, '0"', "well under -> 0");
eq(25.0, '1"', "nearest mark is 1 inch");

console.log("=== Round-trip: every 1/16 from 0 to 120 in ===");
let rtChecked = 0;
const rtBad: string[] = [];
const NAMES: Record<number, string> = {
  0: "", 1: "1/16", 2: "1/8", 3: "3/16", 4: "1/4", 5: "5/16", 6: "3/8",
  7: "7/16", 8: "1/2", 9: "9/16", 10: "5/8", 11: "11/16", 12: "3/4",
  13: "13/16", 14: "7/8", 15: "15/16",
};
for (let w = 0; w <= 120; w++) {
  for (let n = 0; n <= 15; n++) {
    const frac = NAMES[n];
    const text = frac ? (w === 0 ? frac : `${w} ${frac}`) : `${w}`;
    const fwd = parseLength(text)!; // inches -> mm
    const back = mmToTape(fwd.mm); // mm -> inches
    const expectLabel = frac
      ? w === 0
        ? `${frac}"`
        : `${w} ${frac}"`
      : `${w}"`;
    rtChecked++;
    if (back.label !== expectLabel) rtBad.push(`${text} -> ${formatMm(fwd.mm)}mm -> ${back.label} (want ${expectLabel})`);
    if (Math.abs(back.deltaMm) > 1e-9) rtBad.push(`${text} delta ${back.deltaMm}`);
  }
}
console.log(`  round-tripped ${rtChecked} readings, ${rtBad.length} broken`);
for (const b of rtBad.slice(0, 10)) console.log("    " + b);
if (rtBad.length) fail += rtBad.length; else pass++;

console.log("=== Delta reporting ===");
const t600 = mmToTape(600);
console.log(`  600mm -> ${t600.label}, mark = ${formatMm(t600.markMm)}mm, delta ${t600.deltaMm.toFixed(4)}mm`);
const t1000 = mmToTape(1000);
console.log(`  1000mm -> ${t1000.label}, mark = ${formatMm(t1000.markMm)}mm, delta ${t1000.deltaMm.toFixed(4)}mm`);

console.log("=== parseMm input guard ===");
for (const [inp, want] of [["600", 600], ["600.5", 600.5], [".5", 0.5], ["", null], ["abc", null], ["6.0.0", null], ["24 1/8", null]] as [string, number | null][]) {
  const got = parseMm(inp);
  const ok = got === want;
  if (ok) pass++; else { fail++; failures.push(`  parseMm(${JSON.stringify(inp)}) got ${got} want ${want}`); }
}

console.log(`\n${pass} passed, ${fail} failed`);
if (failures.length) {
  console.log("\nFAILURES:");
  for (const f of failures) console.log(f);
}
