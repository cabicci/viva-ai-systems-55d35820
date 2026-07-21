/**
 * Decimal-safe money helpers using integer micro-USD (bigint).
 * 1 USD = 1_000_000 micros. Never use IEEE binary float for ceilings.
 */
import { USD_MICROS_PER_DOLLAR } from "../constants";

export type UsdMicros = bigint;

export function parseUsdMicros(raw: string | undefined | null, field: string): UsdMicros {
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    throw new Error(`${field} missing`);
  }
  const s = String(raw).trim();
  if (!/^\d+$/.test(s)) {
    throw new Error(`${field} must be a non-negative integer micro-USD string`);
  }
  return BigInt(s);
}

export function requirePositiveUsdMicros(value: UsdMicros, field: string): UsdMicros {
  if (value <= 0n) {
    throw new Error(`${field} must be > 0`);
  }
  return value;
}

export function usdToMicros(usdInteger: number): UsdMicros {
  if (!Number.isInteger(usdInteger) || usdInteger < 0) {
    throw new Error("usdInteger must be a non-negative integer dollar amount");
  }
  return BigInt(usdInteger) * USD_MICROS_PER_DOLLAR;
}

export function microsToDisplay(micros: UsdMicros): string {
  const neg = micros < 0n;
  const abs = neg ? -micros : micros;
  const whole = abs / USD_MICROS_PER_DOLLAR;
  const frac = abs % USD_MICROS_PER_DOLLAR;
  const fracStr = frac.toString().padStart(6, "0");
  return `${neg ? "-" : ""}${whole}.${fracStr}`;
}

export function sumMicros(values: Iterable<UsdMicros>): UsdMicros {
  let total = 0n;
  for (const v of values) total += v;
  return total;
}
