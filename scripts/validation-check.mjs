// Self-check for form validators. Run: node scripts/validation-check.mjs
import assert from "node:assert/strict";
import {
  validateGSTIN,
  validatePincode,
  validatePhone,
  validateEmail,
  runSchema,
  required,
} from "../lib/validation.ts";

// GSTIN: 15 chars, 2-digit state + PAN + entity + Z + checksum
assert.equal(validateGSTIN("27ABCDE1234F1Z5"), null);
assert.ok(validateGSTIN("27ABCDE1234F1Z")); // too short → error
assert.ok(validateGSTIN("abc")); // garbage → error
assert.ok(validateGSTIN("")); // required

// Pincode: 6 digits, no leading zero
assert.equal(validatePincode("400001"), null);
assert.ok(validatePincode("012345"));
assert.ok(validatePincode("12345"));

// Phone: Indian mobile, starts 6-9, 10 digits
assert.equal(validatePhone("9820012345"), null);
assert.ok(validatePhone("1234567890"));
assert.ok(validatePhone("98200"));

// Email
assert.equal(validateEmail("a@b.co"), null);
assert.ok(validateEmail("not-an-email"));

// Schema runner collects only failing fields
const errs = runSchema(
  { name: "", gstin: "27ABCDE1234F1Z5" },
  { name: required("Name"), gstin: validateGSTIN },
);
assert.deepEqual(Object.keys(errs), ["name"]);

console.log("validation-check: all assertions passed ✓");
