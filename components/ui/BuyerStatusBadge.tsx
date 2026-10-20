import type { BuyerStatus } from "@/lib/types";

// §9 BuyerStatusBadge: pending, approved, rejected, suspended.
const STYLES: Record<BuyerStatus, { label: string; className: string }> = {
  pending: { label: "Pending review", className: "bg-surface text-muted" },
  approved: { label: "Approved buyer", className: "bg-accent text-accent-ink" },
  rejected: { label: "Application rejected", className: "bg-danger text-accent-ink" },
  suspended: { label: "Account suspended", className: "bg-ink text-bg" },
};

export function BuyerStatusBadge({ status }: { status: BuyerStatus }) {
  const s = STYLES[status];
  return (
    <span className={`inline-flex items-center px-3 py-1 text-small font-display font-bold tracking-tight ${s.className}`}>
      {s.label}
    </span>
  );
}
