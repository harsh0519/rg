import { formatINR } from "@/lib/format";
import type { MinOrderCheck } from "@/lib/types";

// §9 MinOrderBanner: below minimum · met.
export function MinOrderBanner({ check }: { check: MinOrderCheck }) {
  if (check.met) {
    return (
      <div className="bg-accent px-4 py-3 font-serif text-accent-ink">
        Minimum order met — ready to check out.
      </div>
    );
  }
  return (
    <div className="bg-danger px-4 py-3 font-serif text-accent-ink">
      Add {formatINR(check.shortfall)} more to reach the {formatINR(check.min_order_value)} minimum order.
    </div>
  );
}
