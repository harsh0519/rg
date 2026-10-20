// Shared formatting helpers.

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatINR(n: number | null | undefined): string {
  if (n == null) return "—";
  return inr.format(n);
}

export function formatQty(n: number): string {
  return new Intl.NumberFormat("en-IN").format(n);
}
