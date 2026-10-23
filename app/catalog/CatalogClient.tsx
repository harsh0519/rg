"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Filters } from "@/components/catalog/Filters";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  buildFilterOptions,
  filterProducts,
  type CatalogProduct,
  type ProductFilters,
} from "@/lib/catalog-filters";

// Client filtering over the server-fetched Sanity product list (≈72 items — in-memory is fine).
export function CatalogClient({ products }: { products: CatalogProduct[] }) {
  const [filters, setFilters] = useState<ProductFilters>({});
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState(false);

  const options = useMemo(() => buildFilterOptions(products), [products]);
  const shown = useMemo(
    () => filterProducts(products, { ...filters, search: search || undefined }),
    [products, filters, search],
  );
  const activeCount = useMemo(
    () => Object.values(filters).filter((v) => v !== undefined && v !== false).length,
    [filters],
  );

  const clear = () => setFilters({});
  const sidebar = <Filters options={options} value={filters} onChange={setFilters} onClear={clear} />;

  return (
    <>
      <label className="w-full sm:w-80">
        <span className="sr-only">Search by name or SKU</span>
        <input
          type="search"
          placeholder="Search by name or SKU"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-ink/25 bg-paper px-3 py-2.5 font-serif focus:border-accent focus:outline-none"
        />
      </label>

      <div className="mt-8 flex gap-10">
        <aside className="hidden w-64 shrink-0 lg:block">{sidebar}</aside>

        <div className="min-w-0 flex-1">
          <div className="mb-5 flex items-center justify-between lg:hidden">
            <Button variant="outline" onClick={() => setDrawer(true)}>
              Filters{activeCount ? ` (${activeCount})` : ""}
            </Button>
            <span className="font-serif text-small text-muted">{shown.length} products</span>
          </div>

          {shown.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-serif text-lead">No products match these filters.</p>
              <Button variant="outline" className="mt-5" onClick={clear}>
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
              {shown.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={drawer} onClose={() => setDrawer(false)} title="Filters" side="left">
        {sidebar}
        <Button className="mt-6 w-full" onClick={() => setDrawer(false)}>
          Show results
        </Button>
      </Modal>
    </>
  );
}
