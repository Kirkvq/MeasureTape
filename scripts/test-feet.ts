import { feetAndInches, mmToTape } from "../src/lib/convert.ts";

let pass = 0;
let fail = 0;
const failures: string[] = [];

function eq(mm: number, expected: string, note = "") {
  const tape = mmToTape(mm);
  const got = feetAndInches(tape);
  if (got === expected) pass++;
  else {
    fail++;
    failures.push(
      `  ${String(mm).padEnd(8)} (${tape.label}) got ${got.padEnd(14)} want ${expected}  ${note}`
    );
  }
}

console.log("=== The example from the request ===");
eq(3100, "10' 2 1/16\"", "3100mm = 122 1/16\" = 10' 2 1/16\"");

console.log("=== Whole feet ===");
eq(304.8, "1'");
eq(3657.6, "12'");
eq(0, "0\"", "zero has no feet, just 0 inches");

console.log("=== Under a foot: collapses to plain inches, no feet ===");
eq(150, "5 7/8\"");

console.log("=== Feet + whole inches, no fraction ===");
eq(330.2, "1' 1\"", "13 inches exactly = 1' 1\"");

console.log("=== Feet + fraction only, inches part is zero ===");
// 12" + 1/2" = 12.5in = 317.5mm -> 1' 1/2"
eq(317.5, "1' 1/2\"");

console.log("=== Large lengths ===");
eq(10000, "32' 9 11/16\"");

console.log(`\n${pass} passed, ${fail} failed`);
if (failures.length) {
  console.log("\nFAILURES:");
  for (const f of failures) console.log(f);
}
