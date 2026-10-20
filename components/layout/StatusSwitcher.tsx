"use client";

// Dev-only "View as" switcher so every price-gated / badge state in §9 is reachable
// without a backend. Mocks the account statuses GET /me can return.
import { useSession } from "@/lib/session";
import type { BuyerStatus } from "@/lib/types";

const STATUSES: BuyerStatus[] = ["approved", "pending", "rejected", "suspended"];

export function StatusSwitcher() {
  const { me, changeStatus } = useSession();
  return (
    <label className="flex items-center gap-2 text-small text-field-ink/80">
      <span className="font-display font-bold uppercase tracking-tight">View as</span>
      <select
        value={me?.status ?? "approved"}
        onChange={(e) => void changeStatus(e.target.value as BuyerStatus)}
        className="bg-field-ink/10 px-2 py-1 font-serif text-field-ink"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </label>
  );
}
