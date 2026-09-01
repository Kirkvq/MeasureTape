const MM_PER_INCH = 25.4;

export type ParsedLength = {
  inches: number;
  mm: number;
};

/**
 * Parses tape-measure style input into inches.
 * Accepts: "24 1/8", "24-1/8", "1/8", "24", "24.5", "3 3/16"", "600mm", "60cm"
 */
export function parseLength(input: string): ParsedLength | null {
  const raw = input.trim().toLowerCase();
  if (!raw) return null;

  // explicit metric input passthrough, e.g. "600mm" or "60cm"
  const metricMatch = raw.match(/^(-?\d+(?:\.\d+)?)\s*(mm|cm)$/);
  if (metricMatch) {
    const value = parseFloat(metricMatch[1]);
    const mm = metricMatch[2] === "cm" ? value * 10 : value;
    return { inches: mm / MM_PER_INCH, mm };
  }

  const cleaned = raw.replace(/["“”]/g, "").replace(/-/g, " ").trim();
  if (!cleaned) return null;

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0 || parts.length > 2) return null;

  let whole = 0;
  let fraction = 0;

  for (const part of parts) {
    if (part.includes("/")) {
      const [numStr, denStr] = part.split("/");
      const num = parseFloat(numStr);
      const den = parseFloat(denStr);
      if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return null;
      fraction = num / den;
    } else {
      const val = parseFloat(part);
      if (!Number.isFinite(val)) return null;
      whole = val;
    }
  }

  const inches = whole + fraction;
  return { inches, mm: inches * MM_PER_INCH };
}

export function formatMm(mm: number): string {
  return (Math.round(mm * 100) / 100).toString();
}

export function formatInches(inches: number): string {
  return (Math.round(inches * 1000) / 1000).toString();
}
