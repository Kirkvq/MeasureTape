const MM_PER_INCH = 25.4;

export function inchesToMm(inches: number): number {
  return inches * MM_PER_INCH;
}

export type ParsedLength = {
  inches: number;
  mm: number;
};

/** Strict positive number: "24", "24.5", ".5" — but not "24abc", "8'3", "" */
function isPlainNumber(s: string): boolean {
  return /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(s);
}

/**
 * Parses tape-measure style input into inches.
 * Accepts: "24 1/8", "24-1/8", "1/8", "24", "24.5", "3 3/16"", "600mm", "60cm"
 *
 * Rejects anything ambiguous rather than guessing — two whole numbers ("24 5"),
 * two fractions ("1/2 1/4"), or junk ("1/2/3") would otherwise silently produce
 * a plausible-looking but wrong reading.
 */
export function parseLength(input: string): ParsedLength | null {
  const raw = input.trim().toLowerCase();
  if (!raw) return null;

  // explicit metric input passthrough, e.g. "600mm" or "60cm"
  const metricMatch = raw.match(/^(\d+(?:\.\d+)?)\s*(mm|cm)$/);
  if (metricMatch) {
    const value = parseFloat(metricMatch[1]);
    const mm = metricMatch[2] === "cm" ? value * 10 : value;
    return { inches: mm / MM_PER_INCH, mm };
  }

  const cleaned = raw.replace(/["“”]/g, "").replace(/-/g, " ").trim();
  if (!cleaned) return null;

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0 || parts.length > 2) return null;

  let whole: number | null = null;
  let fraction: number | null = null;

  for (const part of parts) {
    if (part.includes("/")) {
      if (fraction !== null) return null; // "1/2 1/4"
      const bits = part.split("/");
      if (bits.length !== 2) return null; // "1/2/3"
      const [numStr, denStr] = bits;
      if (!isPlainNumber(numStr) || !isPlainNumber(denStr)) return null;
      const den = parseFloat(denStr);
      if (den === 0) return null;
      fraction = parseFloat(numStr) / den;
    } else {
      if (whole !== null) return null; // "24 5"
      if (!isPlainNumber(part)) return null; // "24abc", "8'3"
      whole = parseFloat(part);
    }
  }

  const inches = (whole ?? 0) + (fraction ?? 0);
  return { inches, mm: inches * MM_PER_INCH };
}

/**
 * Rounds half-up at the given decimal place, correcting for binary float error.
 * Without the toPrecision pass, 3/8" (exactly 9.525mm) computes as
 * 9.524999999999999 and rounds down to 9.52.
 */
export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(Number((value * factor).toPrecision(15))) / factor;
}

export function formatMm(mm: number): string {
  return roundTo(mm, 2).toString();
}

export type TapeReading = {
  /** Whole inches */
  whole: number;
  /** Fraction, already reduced (0/1 when the reading lands on a whole inch) */
  numerator: number;
  denominator: number;
  /** e.g. `24 1/8"` */
  label: string;
  /** Exact mm value of the tape mark this rounds to */
  markMm: number;
  /** markMm - requested mm; how far the nearest mark sits from the target */
  deltaMm: number;
};

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Strict positive number, for the mm keypad: "600", "600.5", ".5" */
export function parseMm(input: string): number | null {
  const raw = input.trim();
  if (!raw) return null;
  if (!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(raw)) return null;
  const value = parseFloat(raw);
  return Number.isFinite(value) ? value : null;
}

/**
 * Converts mm to the nearest mark on an imperial tape.
 * `precision` is the divisions per inch (16 = nearest 1/16").
 */
export function mmToTape(mm: number, precision = 16): TapeReading {
  const inches = mm / MM_PER_INCH;
  // toPrecision guards the same binary-float boundary problem as roundTo
  const totalDivs = Math.round(Number((inches * precision).toPrecision(15)));

  const whole = Math.floor(totalDivs / precision);
  const rem = totalDivs % precision;

  let numerator = rem;
  let denominator = precision;
  if (rem > 0) {
    const g = gcd(rem, precision);
    numerator = rem / g;
    denominator = precision / g;
  } else {
    denominator = 1;
  }

  const markMm = (totalDivs / precision) * MM_PER_INCH;

  let label: string;
  if (numerator === 0) label = `${whole}"`;
  else if (whole === 0) label = `${numerator}/${denominator}"`;
  else label = `${whole} ${numerator}/${denominator}"`;

  return { whole, numerator, denominator, label, markMm, deltaMm: markMm - mm };
}

export function formatInches(inches: number): string {
  return roundTo(inches, 3).toString();
}

/**
 * Splits a tape reading's whole-inch count into feet + remaining inches.
 * The fraction stays attached to the inches, e.g. 122 1/16" -> 10' 2 1/16".
 * Pure integer division on `whole` — no new rounding, so it can't drift
 * from the reading `tape` already reports.
 */
export function feetAndInches(tape: TapeReading): string {
  const feet = Math.floor(tape.whole / 12);
  const inches = tape.whole % 12;

  const inchPart =
    tape.numerator === 0
      ? `${inches}"`
      : inches === 0
      ? `${tape.numerator}/${tape.denominator}"`
      : `${inches} ${tape.numerator}/${tape.denominator}"`;

  if (feet === 0) return inchPart;
  if (inches === 0 && tape.numerator === 0) return `${feet}'`;
  return `${feet}' ${inchPart}`;
}
