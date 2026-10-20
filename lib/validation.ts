// Form field validation (doc §7 "Forms": GSTIN, pincode, phone). Pure predicates +
// a tiny schema runner so forms can show inline errors without a validation library.

export const GSTIN_RE =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const PINCODE_RE = /^[1-9][0-9]{5}$/;
export const PHONE_RE = /^[6-9][0-9]{9}$/; // Indian mobile
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateGSTIN(v: string): string | null {
  if (!v.trim()) return "GSTIN is required";
  if (!GSTIN_RE.test(v.trim().toUpperCase())) return "Enter a valid 15-character GSTIN";
  return null;
}
export function validatePincode(v: string): string | null {
  if (!v.trim()) return "Pincode is required";
  if (!PINCODE_RE.test(v.trim())) return "Enter a valid 6-digit pincode";
  return null;
}
export function validatePhone(v: string): string | null {
  if (!v.trim()) return "Phone is required";
  if (!PHONE_RE.test(v.trim())) return "Enter a valid 10-digit mobile number";
  return null;
}
export function validateEmail(v: string): string | null {
  if (!v.trim()) return "Email is required";
  if (!EMAIL_RE.test(v.trim())) return "Enter a valid email";
  return null;
}
export function required(label: string) {
  return (v: string): string | null => (v.trim() ? null : `${label} is required`);
}

export type Validator = (v: string) => string | null;

/** Run a map of field validators; returns a map of the fields that failed. */
export function runSchema<T extends Record<string, string>>(
  values: T,
  schema: Partial<Record<keyof T, Validator>>,
): Partial<Record<keyof T, string>> {
  const errors: Partial<Record<keyof T, string>> = {};
  for (const key in schema) {
    const v = schema[key];
    if (!v) continue;
    const err = v(values[key] ?? "");
    if (err) errors[key] = err;
  }
  return errors;
}
