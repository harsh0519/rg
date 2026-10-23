"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setProductStockAction } from "@/lib/actions/admin";
import type { AdminProduct } from "@/lib/data/admin";
import { useToast } from "@/components/ui/Toast";
import { formatINR, formatQty } from "@/lib/format";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

const stockOf = (p: AdminProduct) => p.variants.reduce((s, v) => s + v.stock, 0);

export function AdminProductsClient({ products }: { products: AdminProduct[] }) {
  const [editing, setEditing] = useState<AdminProduct | null>(null);

  const columns: Column<AdminProduct>[] = [
    {
      key: "name",
      header: "Product",
      render: (p) => (
        <div>
          <p className="font-semibold">{p.name}</p>
          <p className="text-small text-muted">{p.category} · {p.fabric} · {p.priceTierLabel}</p>
        </div>
      ),
    },
    { key: "moq", header: "MOQ", align: "right", render: (p) => `${formatQty(p.moq)}` },
    {
      key: "tiers",
      header: "Tiers (₹/pc)",
      render: (p) => (p.priceTiers.length ? p.priceTiers.map((t) => formatINR(t.price).replace("₹", "")).join(" / ") : "—"),
    },
    {
      key: "stock",
      header: "Stock",
      align: "right",
      render: (p) => <span className={stockOf(p) === 0 ? "text-danger" : ""}>{formatQty(stockOf(p))}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (p) => <Button variant="outline" onClick={() => setEditing(p)}>Inventory</Button>,
    },
  ];

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="font-serif text-muted">{products.length} products</p>
        {/* Catalog authoring lives in Studio — don't duplicate it here. */}
        <ButtonLink href="/adminpanel" variant="outline">Add / edit in Studio</ButtonLink>
      </div>

      <DataTable columns={columns} rows={products} keyOf={(p) => p.id} />

      {editing && (
        <InventoryModal key={editing.id} product={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}

function InventoryModal({ product, onClose }: { product: AdminProduct; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [stocks, setStocks] = useState<Record<string, number>>(
    Object.fromEntries(product.variants.map((v) => [v.id, v.stock])),
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const res = await setProductStockAction(
      product.id,
      product.variants.map((v) => ({ key: v.id, stock: stocks[v.id] ?? v.stock })),
    );
    setSaving(false);
    if (res.ok) {
      toast("Inventory updated");
      onClose();
      router.refresh();
    } else {
      toast(res.error, "error");
    }
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
      <Button onClick={save} disabled={saving} className="mt-5">{saving ? "Saving…" : "Save inventory"}</Button>
    </Modal>
  );
}
