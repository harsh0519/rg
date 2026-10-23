"use client";

import type { ProductFilters, FilterOptions } from "@/lib/catalog-filters";

export type { FilterOptions };

// Catalog filters (doc §3.2). Rendered in a desktop sidebar and inside the mobile
// drawer (§9 Filters: desktop sidebar · mobile drawer) — same controlled component.
export function Filters({
  options,
  value,
  onChange,
  onClear,
}: {
  options: FilterOptions;
  value: ProductFilters;
  onChange: (next: ProductFilters) => void;
  onClear: () => void;
}) {
  const set = (patch: Partial<ProductFilters>) => onChange({ ...value, ...patch });

  const group = (label: string, key: keyof ProductFilters, items: string[]) => (
    <fieldset className="border-t border-ink/15 py-5">
      <legend className="mb-3 font-display text-small font-bold uppercase tracking-tight">{label}</legend>
      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const checked = value[key] === item;
          return (
            <label key={item} className="flex cursor-pointer items-center gap-2 font-serif text-body">
              <input
                type="radio"
                name={String(key)}
                checked={checked}
                onChange={() => set({ [key]: checked ? undefined : item } as Partial<ProductFilters>)}
                onClick={() => checked && set({ [key]: undefined } as Partial<ProductFilters>)}
                className="accent-accent"
              />
              {item}
            </label>
          );
        })}
      </div>
    </fieldset>
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-3 pb-2">
        <span className="font-display text-small font-bold uppercase tracking-tight text-muted">Filter</span>
        <button onClick={onClear} className="font-display text-small font-bold uppercase tracking-tight text-accent hover:underline">
          Clear all
        </button>
      </div>

      <label className="flex items-center gap-2 border-t border-ink/15 py-5">
        <input
          type="checkbox"
          checked={!!value.inStockOnly}
          onChange={(e) => set({ inStockOnly: e.target.checked || undefined })}
          className="accent-accent"
        />
        <span className="font-serif">In stock only</span>
      </label>

      {group("Category", "category", options.categories)}
      {group("Fabric", "fabric", options.fabrics)}
      {group("Colour", "color", options.colors)}
      {group("Size", "size", options.sizes)}
      {group("Price tier", "tier", options.tiers)}
    </div>
  );
}
