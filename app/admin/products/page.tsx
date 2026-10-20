"use client";

import { useEffect, useState } from "react";
import { getAdminProducts, setVariantStock } from "@/lib/adminApi";
import { useToast } from "@/components/ui/Toast";
import { formatINR, formatQty } from "@/lib/format";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import type { ProductDetail } from "@/lib/types";

export default function AdminProductsPage() {
  const toast = useToast();
  const [products, setProducts] = useState<ProductDetail[] | null>(null);
  const [editing, setEditing] = useState<ProductDetail | null>(null);

  const load = () => getAdminProducts().then(setProducts);
  useEffect(() => {
    load();
  }, []);

  const stockOf = (p: ProductDetail) => p.variants.reduce((s, v) => s + v.stock, 0);

  const columns: Column<ProductDetail>[] = [
    {
      key: "name",
      header: "Product",
      render: (p) => (
        <div>
          <p className="font-semibold">{p.name}</p>
          <p className="text-small text-muted">{p.category} · {p.fabric} · {p.price_tier_label}</p>
        </div>
      ),
    },
    { key: "moq", header: "MOQ", align: "right", render: (p) => `${formatQty(p.moq)}` },
    {
      key: "tiers",
      header: "Tiers (₹/pc)",
      render: (p) => p.price_tiers.map((t) => formatINR(t.price).replace("₹", "")).join(" / "),
    },
    {
      key: "stock",
      header: "Stock",
      align: "right",
      render: (p) => (
        <span className={stockOf(p) === 0 ? "text-danger" : ""}>{formatQty(stockOf(p))}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (p) => (
        <Button variant="outline" onClick={() => setEditing(p)}>Inventory</Button>
      ),
    },
  ];

  if (!products) return <Skeleton className="h-64 w-full" />;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="font-serif text-muted">{products.length} products</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => toast("CSV import is mocked — wire to the bulk-import endpoint.")}>
            Import CSV
          </Button>
          <Button onClick={() => toast("Product create is mocked in this build.")}>New product</Button>
        </div>
      </div>

      <DataTable columns={columns} rows={products} keyOf={(p) => p.id} />

      {editing && (
        <InventoryModal
          key={editing.id}
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            toast("Inventory updated");
            setEditing(null);
            load();
          }}
        />
      )}
    </>
  );
}

// Keyed by product.id in the parent, so a fresh mount seeds state from props — no effect.
function InventoryModal({
  product,
  onClose,
  onSaved,
}: {
  product: ProductDetail;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [stocks, setStocks] = useState<Record<string, number>>(
    Object.fromEntries(product.variants.map((v) => [v.id, v.stock])),
  );

  const save = async () => {
    await Promise.all(product.variants.map((v) => setVariantStock(v.id, stocks[v.id] ?? v.stock)));
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title={`Inventory — ${product.name}`}>
      <div className="grid grid-cols-2 gap-3">
        {product.variants.map((v) => (
          <label key={v.id} className="flex items-center justify-between gap-2 font-serif text-small">
            <span>{v.color} {v.size}</span>
            <input
              type="number"
              min={0}
              value={stocks[v.id] ?? 0}
              onChange={(e) => setStocks((s) => ({ ...s, [v.id]: Math.max(0, parseInt(e.target.value || "0", 10) || 0) }))}
              className="w-20 border border-ink/20 bg-paper px-2 py-1.5 text-center tnum focus:border-accent focus:outline-none"
            />
          </label>
        ))}
      </div>
      <Button onClick={save} className="mt-5">Save inventory</Button>
    </Modal>
  );
}
