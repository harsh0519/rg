"use client";

import { useRef, useState } from "react";
import { formatQty } from "@/lib/format";
import type { ProductDetail, Variant } from "@/lib/types";

// Order matrix (doc §3.3 / §7): rows = colours, columns = sizes, cells = quantity.
// Keyboard navigation, paste-from-spreadsheet, row/column totals, sticky headers;
// becomes a per-colour accordion on small screens.
//
// §9 states are expressed per cell/summary: empty (all zero) · partial · over stock
// (qty > stock) · below MOQ (handled by the parent summary) · valid.

export type Quantities = Record<string, number>;

export function OrderMatrix({
  product,
  quantities,
  onChange,
}: {
  product: ProductDetail;
  quantities: Quantities;
  onChange: (next: Quantities) => void;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [openColor, setOpenColor] = useState<string>(product.colors[0] ?? "");

  const variantAt = (color: string, size: string): Variant | undefined =>
    product.variants.find((v) => v.color === color && v.size === size);

  const setQty = (variantId: string, qty: number) => {
    const next = { ...quantities };
    if (qty > 0) next[variantId] = qty;
    else delete next[variantId];
    onChange(next);
  };

  const rowTotal = (color: string) =>
    product.sizes.reduce((s, size) => {
      const v = variantAt(color, size);
      return s + (v ? quantities[v.id] ?? 0 : 0);
    }, 0);

  const colTotal = (size: string) =>
    product.colors.reduce((s, color) => {
      const v = variantAt(color, size);
      return s + (v ? quantities[v.id] ?? 0 : 0);
    }, 0);

  const grand = product.colors.reduce((s, c) => s + rowTotal(c), 0);

  // ---- keyboard navigation (desktop grid) --------------------------------
  const focusCell = (r: number, c: number, dr: number, dc: number) => {
    const root = gridRef.current;
    if (!root) return;
    let nr = r + dr;
    let nc = c + dc;
    // step over disabled/missing cells in the travel direction
    while (nr >= 0 && nr < product.colors.length && nc >= 0 && nc < product.sizes.length) {
      const el = root.querySelector<HTMLInputElement>(`input[data-r="${nr}"][data-c="${nc}"]`);
      if (el && !el.disabled) {
        el.focus();
        el.select();
        return;
      }
      nr += dr || 0;
      nc += dc || 0;
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, r: number, c: number) => {
    const map: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      Enter: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    const move = map[e.key];
    if (!move) return;
    // let left/right work normally while editing text unless at the caret edge
    const input = e.currentTarget;
    if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && input.selectionStart !== input.selectionEnd) return;
    if (e.key === "ArrowLeft" && input.selectionStart !== 0) return;
    if (e.key === "ArrowRight" && input.selectionStart !== input.value.length) return;
    e.preventDefault();
    focusCell(r, c, move[0], move[1]);
  };

  // ---- paste from spreadsheet --------------------------------------------
  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>, startR: number, startC: number) => {
    const text = e.clipboardData.getData("text");
    if (!text || !/[\t\n]/.test(text)) return; // single value → let the input handle it
    e.preventDefault();
    const rows = text.replace(/\r/g, "").replace(/\n+$/, "").split("\n").map((line) => line.split("\t"));
    const next = { ...quantities };
    rows.forEach((cols, dr) => {
      cols.forEach((cell, dc) => {
        const color = product.colors[startR + dr];
        const size = product.sizes[startC + dc];
        if (!color || !size) return;
        const v = variantAt(color, size);
        if (!v || v.stock === 0) return;
        const n = parseInt(cell.replace(/[^\d]/g, ""), 10);
        if (Number.isNaN(n)) return;
        if (n > 0) next[v.id] = n;
        else delete next[v.id];
      });
    });
    onChange(next);
  };

  const cellInput = (color: string, size: string, r: number, c: number, mobile = false) => {
    const v = variantAt(color, size);
    if (!v) return <span className="text-muted">—</span>;
    const qty = quantities[v.id] ?? 0;
    const oos = v.stock === 0;
    const over = qty > v.stock;
    return (
      <input
        type="number"
        min={0}
        inputMode="numeric"
        data-r={r}
        data-c={c}
        aria-label={`${color} ${size} quantity`}
        disabled={oos}
        value={qty === 0 ? "" : qty}
        placeholder={oos ? "—" : "0"}
        title={oos ? "Out of stock" : over ? `Only ${v.stock} in stock` : `${v.stock} in stock`}
        onKeyDown={mobile ? undefined : (e) => onKeyDown(e, r, c)}
        onPaste={mobile ? undefined : (e) => onPaste(e, r, c)}
        onChange={(e) => setQty(v.id, Math.max(0, parseInt(e.target.value || "0", 10) || 0))}
        className={`w-full bg-paper px-2 py-2 text-center font-serif tnum tabular-nums focus:outline-none focus:ring-2 focus:ring-accent disabled:bg-surface disabled:text-muted ${
          over ? "border border-danger text-danger" : "border border-ink/15"
        }`}
      />
    );
  };

  return (
    <div>
      {/* Desktop grid */}
      <div ref={gridRef} className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-bg p-2 text-left font-display text-small font-bold uppercase tracking-tight">
                Colour \ Size
              </th>
              {product.sizes.map((s) => (
                <th key={s} className="p-2 font-display text-small font-bold uppercase tracking-tight">
                  {s}
                </th>
              ))}
              <th className="p-2 text-right font-display text-small font-bold uppercase tracking-tight">Row</th>
            </tr>
          </thead>
          <tbody>
            {product.colors.map((color, r) => (
              <tr key={color}>
                <th className="sticky left-0 z-10 bg-bg p-2 text-left font-serif font-semibold">{color}</th>
                {product.sizes.map((size, c) => (
                  <td key={size} className="p-1">
                    {cellInput(color, size, r, c)}
                  </td>
                ))}
                <td className="p-2 text-right font-serif tnum font-semibold">{formatQty(rowTotal(color))}</td>
              </tr>
            ))}
            <tr>
              <th className="sticky left-0 z-10 bg-bg p-2 text-left font-display text-small font-bold uppercase tracking-tight">
                Column
              </th>
              {product.sizes.map((size) => (
                <td key={size} className="p-2 text-center font-serif tnum font-semibold">
                  {formatQty(colTotal(size))}
                </td>
              ))}
              <td className="bg-accent p-2 text-right font-display tnum font-bold text-accent-ink">
                {formatQty(grand)}
              </td>
            </tr>
          </tbody>
        </table>
        <p className="mt-2 font-serif text-small text-muted">
          Tip: use arrow keys to move between cells, or paste a block of quantities from a spreadsheet.
        </p>
      </div>

      {/* Mobile: per-colour accordion */}
      <div className="md:hidden">
        {product.colors.map((color) => {
          const open = openColor === color;
          const rt = rowTotal(color);
          return (
            <div key={color} className="border-b border-ink/15">
              <button
                onClick={() => setOpenColor(open ? "" : color)}
                aria-expanded={open}
                className="flex w-full items-center justify-between py-3 text-left"
              >
                <span className="font-serif font-semibold">{color}</span>
                <span className="font-serif tnum text-muted">{rt > 0 ? `${formatQty(rt)} pcs` : "—"}</span>
              </button>
              {open && (
                <div className="grid grid-cols-2 gap-3 pb-4">
                  {product.sizes.map((size, c) => (
                    <label key={size} className="flex items-center gap-2">
                      <span className="w-10 font-display text-small font-bold uppercase tracking-tight">{size}</span>
                      {cellInput(color, size, product.colors.indexOf(color), c, true)}
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div className="flex items-center justify-between py-3">
          <span className="font-display text-small font-bold uppercase tracking-tight">Total</span>
          <span className="font-serif tnum font-bold">{formatQty(grand)} pcs</span>
        </div>
      </div>
    </div>
  );
}
