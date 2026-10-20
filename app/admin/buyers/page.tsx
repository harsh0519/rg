"use client";

import { useEffect, useState } from "react";
import { getBuyers, setBuyerStatus, updateBuyer, ALL_PAYMENT_TERMS } from "@/lib/adminApi";
import { useToast } from "@/components/ui/Toast";
import { formatINR } from "@/lib/format";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { BuyerStatusBadge } from "@/components/ui/BuyerStatusBadge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Buyer, BuyerStatus, PaymentTerms } from "@/lib/types";

export default function AdminBuyersPage() {
  const toast = useToast();
  const [buyers, setBuyers] = useState<Buyer[] | null>(null);
  const [editing, setEditing] = useState<Buyer | null>(null);

  const load = () => getBuyers().then(setBuyers);
  useEffect(() => {
    load();
  }, []);

  const changeStatus = async (b: Buyer, status: BuyerStatus) => {
    await setBuyerStatus(b.id, status);
    toast(`${b.business_name} → ${status}`);
    load();
  };

  const columns: Column<Buyer>[] = [
    {
      key: "name",
      header: "Buyer",
      render: (b) => (
        <div>
          <p className="font-semibold">{b.business_name}</p>
          <p className="text-small text-muted">{b.contact_name} · {b.state} · {b.gstin}</p>
        </div>
      ),
    },
    { key: "type", header: "Type", render: (b) => b.business_type },
    { key: "status", header: "Status", render: (b) => <BuyerStatusBadge status={b.status} /> },
    { key: "credit", header: "Credit", align: "right", render: (b) => formatINR(b.credit_limit) },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (b) => (
        <div className="flex flex-wrap justify-end gap-2">
          {b.status !== "approved" && (
            <Button variant="outline" onClick={() => changeStatus(b, "approved")}>Approve</Button>
          )}
          {b.status !== "suspended" && b.status === "approved" && (
            <Button variant="ghost" onClick={() => changeStatus(b, "suspended")}>Suspend</Button>
          )}
          {b.status === "pending" && (
            <Button variant="ghost" onClick={() => changeStatus(b, "rejected")}>Reject</Button>
          )}
          <Button variant="ghost" onClick={() => setEditing(b)}>Edit</Button>
        </div>
      ),
    },
  ];

  if (!buyers) return <Skeleton className="h-64 w-full" />;

  return (
    <>
      <DataTable columns={columns} rows={buyers} keyOf={(b) => b.id} empty="No buyers yet." />
      {editing && (
        <BuyerEditModal
          key={editing.id}
          buyer={editing}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            toast(msg);
            setEditing(null);
            load();
          }}
        />
      )}
    </>
  );
}

// Keyed by buyer.id in the parent, so a fresh mount seeds state from props — no effect.
function BuyerEditModal({
  buyer,
  onClose,
  onSaved,
}: {
  buyer: Buyer;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [credit, setCredit] = useState(String(buyer.credit_limit));
  const [priceList, setPriceList] = useState(buyer.price_list_id ?? "");
  const [terms, setTerms] = useState<PaymentTerms[]>(buyer.payment_terms);

  const toggleTerm = (t: PaymentTerms) =>
    setTerms((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const save = async () => {
    await updateBuyer(buyer.id, {
      credit_limit: Math.max(0, parseInt(credit || "0", 10) || 0),
      price_list_id: priceList.trim() || null,
      payment_terms: terms,
    });
    onSaved(`Updated ${buyer.business_name}`);
  };

  return (
    <Modal open onClose={onClose} title={`Edit ${buyer.business_name}`}>
      <div className="flex flex-col gap-4">
        <Field id="credit" label="Credit limit (₹)" inputMode="numeric" value={credit} onChange={(e) => setCredit(e.target.value)} />
        <Field id="pricelist" label="Price list ID" hint="e.g. pl-anand-retail" value={priceList} onChange={(e) => setPriceList(e.target.value)} />
        <div>
          <span className="mb-2 block font-display text-small font-bold uppercase tracking-tight">Payment terms</span>
          <div className="flex gap-4 font-serif">
            {ALL_PAYMENT_TERMS.map((t) => (
              <label key={t} className="flex items-center gap-2">
                <input type="checkbox" checked={terms.includes(t)} onChange={() => toggleTerm(t)} className="accent-accent" />
                {t}
              </label>
            ))}
          </div>
        </div>
        <Button onClick={save} className="mt-2">Save changes</Button>
      </div>
    </Modal>
  );
}
