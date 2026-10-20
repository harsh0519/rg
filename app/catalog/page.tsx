"use client";

import { useEffect, useMemo, useState } from "react";
import { getProducts, type ProductFilters } from "@/lib/mockApi";
import type { ProductSummary } from "@/lib/types";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Filters, type FilterOptions } from "@/components/catalog/Filters";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/session";

type Status = "loading" | "ready" | "error";

function buildOptions(all: ProductSummary[]): FilterOptions {
  const uniq = (xs: string[]) => [...new Set(xs)].sort();
  return {
    categories: uniq(all.map((p) => p.category)),
    fabrics: uniq(all.map((p) => p.fabric)),
    colors: uniq(all.flatMap((p) => p.colors)),
    sizes: uniq(all.flatMap((p) => p.sizes)),
    tiers: uniq(all.map((p) => p.price_tier_label)),
  };
}

export default function CatalogPage() {
  const { approved } = useSession();
  const [filters, setFilters] = useState<ProductFilters>({});
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<ProductSummary[] | null>(null);
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [drawer, setDrawer] = useState(false);

  // options from an initial unfiltered fetch
  useEffect(() => {
    let active = true;
    getProducts()
      .then((all) => active && setOptions(buildOptions(all)))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // refetch on filter/search/approval change (initial state is already "loading")
  useEffect(() => {
    let active = true;
    getProducts({ ...filters, search: search || undefined })
      .then((p) => {
        if (!active) return;
        setProducts(p);
        setStatus("ready");
      })
      .catch(() => active && setStatus("error"));
    return () => {
      active = false;
    };
  }, [filters, search, approved]);

  const activeCount = useMemo(
    () => Object.values(filters).filter((v) => v !== undefined && v !== false).length,
    [filters],
  );

  const clear = () => setFilters({});

  const sidebar = options && (
    <Filters options={options} value={filters} onChange={setFilters} onClear={clear} />
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-head">Catalog</h1>
          <p className="mt-2 font-serif text-muted">
            {approved ? "Your wholesale rates are shown." : "Log in as an approved buyer to see pricing."}
          </p>
        </div>
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
      </header>

      <div className="mt-8 flex gap-10">
        <aside className="hidden w-64 shrink-0 lg:block">{sidebar}</aside>

        <div className="min-w-0 flex-1">
          <div className="mb-5 flex items-center justify-between lg:hidden">
            <Button variant="outline" onClick={() => setDrawer(true)}>
              Filters{activeCount ? ` (${activeCount})` : ""}
            </Button>
            <span className="font-serif text-small text-muted">
              {products ? `${products.length} products` : ""}
            </span>
          </div>

          {status === "loading" && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          )}

          {status === "error" && (
            <div className="py-20 text-center">
              <p className="font-serif text-lead">Couldn’t load the catalog.</p>
              <p className="mt-2 font-serif text-muted">Check your connection and try again.</p>
              <Button className="mt-5" onClick={() => setFilters({ ...filters })}>
                Retry
              </Button>
            </div>
          )}

          {status === "ready" && products && products.length === 0 && (
            <div className="py-20 text-center">
              <p className="font-serif text-lead">No products match these filters.</p>
              <Button variant="outline" className="mt-5" onClick={clear}>
                Clear filters
              </Button>
            </div>
          )}

          {status === "ready" && products && products.length > 0 && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
              {products.map((p) => (
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
    </div>
  );
}
