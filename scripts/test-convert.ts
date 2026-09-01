import { parseLength, formatMm, formatInches } from "../src/lib/convert.ts";

let pass = 0;
let fail = 0;
const failures: string[] = [];

/** Expect a parse to succeed and produce an exact mm value (before display rounding). */
function eqMm(input: string, expectedMm: number | null, note = "") {
  const r = parseLength(input);
  const got = r ? r.mm : null;
  const ok =
    expectedMm === null
      ? got === null
      : got !== null && Math.abs(got - expectedMm) < 1e-9;
  const shown = got === null ? "null" : got.toString();
  const want = expectedMm === null ? "null" : expectedMm.toString();
  if (ok) {
    pass++;
  } else {
    fail++;
    failures.push(
      `  ${JSON.stringify(input).padEnd(14)} got ${shown.padEnd(12)} want ${want}  ${note}`
    );
  }
}

/** Expect the *displayed* string, i.e. what the user actually reads on screen. */
function eqDisplay(input: string, expected: string, note = "") {
  const r = parseLength(input);
  const got = r ? formatMm(r.mm) : "null";
  if (got === expected) {
    pass++;
  } else {
    fail++;
    failures.push(
      `  ${JSON.stringify(input).padEnd(14)} displayed ${got.padEnd(10)} want ${expected}  ${note}`
    );
  }
}

const MM = 25.4;

console.log("=== 1. Whole inches ===");
eqMm("1", 25.4);
eqMm("12", 304.8);
eqMm("24", 609.6);
eqMm("36", 914.4);
eqMm("100", 2540);
eqMm("0", 0);

console.log("=== 2. Every 16th (the full tape face) ===");
const sixteenths: [string, number][] = [
  ["1/16", 1 / 16], ["1/8", 2 / 16], ["3/16", 3 / 16], ["1/4", 4 / 16],
  ["5/16", 5 / 16], ["3/8", 6 / 16], ["7/16", 7 / 16], ["1/2", 8 / 16],
  ["9/16", 9 / 16], ["5/8", 10 / 16], ["11/16", 11 / 16], ["3/4", 12 / 16],
  ["13/16", 13 / 16], ["7/8", 14 / 16], ["15/16", 15 / 16],
];
for (const [s, v] of sixteenths) eqMm(s, v * MM);

console.log("=== 3. Mixed numbers (the main use case) ===");
eqMm("24 1/8", 24.125 * MM);
eqMm("24-1/8", 24.125 * MM, "dash separator");
eqMm('24 1/8"', 24.125 * MM, "with inch mark");
eqMm("3 3/16", 3.1875 * MM);
eqMm("8 7/8", 8.875 * MM);
eqMm("47 15/16", 47.9375 * MM);
eqMm("96 1/2", 96.5 * MM, "8ft as inches");

console.log("=== 4. Decimal inches ===");
eqMm("24.5", 24.5 * MM);
eqMm("0.125", 0.125 * MM);
eqMm(".5", 0.5 * MM);

console.log("=== 5. Metric passthrough ===");
eqMm("600mm", 600);
eqMm("600 mm", 600);
eqMm("60cm", 600);
eqMm("1200mm", 1200);

console.log("=== 6. Whitespace / casing tolerance ===");
eqMm("  24 1/8  ", 24.125 * MM);
eqMm("24  1/8", 24.125 * MM, "double space");
eqMm("600MM", 600, "uppercase");

console.log("=== 7. Junk that must be rejected ===");
eqMm("", null);
eqMm("   ", null);
eqMm("abc", null);
eqMm("/", null);
eqMm("1/", null);
eqMm("/8", null);
eqMm("1/0", null, "divide by zero");
eqMm("24 1/8 3/4", null, "too many parts");
eqMm("24 5", null, "two whole numbers - was silently 127mm");
eqMm("1/2 1/4", null, "two fractions - was silently 6.35mm");
eqMm("1/2/3", null, "multiple slashes - was silently 12.7mm");
eqMm("24abc", null, "trailing junk - was silently 609.6mm");
eqMm("8'3", null, "feet notation - was silently 203.2mm");

console.log("=== 7b. Still-valid inputs that must NOT be over-rejected ===");
eqMm("1/8 24", 24.125 * MM, "reversed order is unambiguous");
eqMm("24 9/8", 25.125 * MM, "improper fraction is mathematically valid");
eqMm("1/3", (1 / 3) * MM, "non-power-of-2 denominator");
eqMm("0 1/2", 0.5 * MM, "explicit zero whole");

console.log("=== 8. Display rounding (float-safety on .xx5 boundaries) ===");
eqDisplay("1/8", "3.18");
eqDisplay("3/8", "9.53");
eqDisplay("5/8", "15.88");
eqDisplay("7/8", "22.23", "22.225 exact -> float risk");
eqDisplay("24 1/8", "612.78", "612.775 exact -> float risk");
eqDisplay("1/2", "12.7");
eqDisplay("1/4", "6.35");
eqDisplay("1", "25.4");
eqDisplay("2 1/8", "53.98", "53.975 exact -> float risk");
eqDisplay("47 3/8", "1203.33", "1203.325 exact -> float risk");
eqDisplay("3/8", "9.53", "9.525 exact -> float risk");

console.log("=== 9. Suspicious inputs (documenting current behavior) ===");
const suspicious = [
  "24 5", "1/2 1/4", "1/8 24", "24abc", "24 9/8", "1/2/3", "8'3", "-5", "1/3",
];
for (const s of suspicious) {
  const r = parseLength(s);
  console.log(
    `  ${JSON.stringify(s).padEnd(12)} -> ${
      r ? `${formatInches(r.inches)}in / ${formatMm(r.mm)}mm` : "null (rejected)"
    }`
  );
}

console.log(`\n${pass} passed, ${fail} failed`);
if (failures.length) {
  console.log("\nFAILURES:");
  for (const f of failures) console.log(f);
}
