import { mmToTape, feetAndInches } from "../src/lib/convert.ts";

let pass = 0;
let fail = 0;
const failures: string[] = [];

function eq(mm: number, expected: string, note = "") {
  const got = mmToTape(mm, 8).label;
  if (got === expected) pass++;
  else {
    fail++;
    failures.push(`  ${String(mm).padEnd(10)} got ${got.padEnd(12)} want ${expected}  ${note}`);
  }
}

console.log("=== App now rounds to nearest 1/8, never shows a 16th ===");
eq(600, '23 5/8"');
eq(1000, '39 3/8"');
eq(100, '3 7/8"', "was 3 15/16 at 1/16 precision");
eq(500, '19 5/8"', "was 19 11/16 at 1/16 precision");
eq(2400, '94 1/2"');
eq(50, '2"');
eq(1.5875, '1/8"', "old 1/16 mark rounds up to 1/8");
eq(3100, '122"', "the request's own example now lands on a flat inch");

console.log("=== No denominator of 16 ever appears ===");
let sawSixteenth = false;
for (let mm = 0; mm <= 5000; mm += 1) {
  const t = mmToTape(mm, 8);
  if (t.denominator === 16) sawSixteenth = true;
}
if (!sawSixteenth) pass++;
else {
  fail++;
  failures.push("  found a /16 denominator in 0-5000mm sweep");
}

console.log("=== Feet card follows the same 1/8 rounding ===");
const t = mmToTape(3100, 8);
const label = feetAndInches(t);
if (label === "10' 2\"") pass++;
else {
  fail++;
  failures.push(`  feetAndInches(3100mm @ 1/8) got ${label} want 10' 2"`);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (failures.length) {
  console.log("\nFAILURES:");
  for (const f of failures) console.log(f);
}
