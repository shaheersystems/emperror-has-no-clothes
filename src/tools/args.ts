// Shared argument coercion/validation helpers for tools.

export function asString(v: unknown, field: string): string {
  if (typeof v !== "string") throw new Error(`Expected ${field} to be a string`);
  return v;
}

export function asStringOr(v: unknown, field: string, fallback: string): string {
  if (v === undefined || v === null) return fallback;
  return asString(v, field);
}
