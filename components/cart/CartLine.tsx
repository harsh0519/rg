"use client";

import Link from "next/link";
import { formatINR, formatQty } from "@/lib/format";
import type { CartLineView } from "@/lib/types";

// §9 CartLine: editable qty · stock warning · removed.
export function CartLine({
  line,
  removed,
  onQty,
  onRemove,
  onUndo,
}: {
  line: CartLineView;
  removed?: boolean;
  onQty: (qty: number) => void;
  onRemove: () => void;
  onUndo: () => void;
}) {
  if (removed) {
    return (
      <div className="flex items-center justify-between gap-4 bg-surface px-4 py-4 font-serif text-muted">
        <span>
          Removed {line.product_name} · {line.color} {line.size}
        </span>
        <button onClick={onUndo} className="font-display text-small font-bold uppercase tracking-tight text-accent hover:underline">
          Undo
        </button>
      </div>
    );
  }

  const overStock = line.qty > line.stock;

  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-ink/10 py-5">
      <div className="min-w-0 flex-1">
        <Link href={`/products/${line.product_slug}`} className="font-display text-body font-bold hover:text-accent">
          {line.product_name}
        </Link>
        <p className="mt-0.5 font-serif text-small text-muted">
          {line.color} · {line.size} · {line.sku}
        </p>
        {overStock && (
          <p className="mt-1 font-serif text-small text-danger">
            Only {formatQty(line.stock)} in stock — reduce quantity.
          </p>
        )}
      </div>

      <label className="flex items-center gap-2">
        <span className="sr-only">Quantity</span>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={line.qty}
          onChange={(e) => onQty(Math.max(0, parseInt(e.target.value || "0", 10) || 0))}
          className={`w-20 bg-paper px-2 py-2 text-center font-serif tnum focus:outline-none focus:ring-2 focus:ring-accent ${
            overStock ? "border border-danger text-danger" : "border border-ink/20"
          }`}
        />
      </label>

      <div className="w-28 text-right font-serif tnum">
        {line.unit_price != null ? (
          <>
            <p>{formatINR(line.line_total)}</p>
            <p className="text-small text-muted">{formatINR(line.unit_price)} / pc</p>
          </>
        ) : (
          <span className="text-muted">—</span>
        )}
      </div>

      <button
        onClick={onRemove}
        className="font-display text-small font-bold uppercase tracking-tight text-muted hover:text-danger"
      >
        Remove
      </button>
    </div>
  );
}
