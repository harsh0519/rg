"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setBuyerStatusAction, updateBuyerAction } from "@/lib/actions/admin";
import { useToast } from "@/components/ui/Toast";
import { formatINR } from "@/lib/format";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { BuyerStatusBadge } from "@/components/ui/BuyerStatusBadge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import type { Buyer, BuyerStatus, PaymentTerms } from "@/lib/types";

const ALL_PAYMENT_TERMS: PaymentTerms[] = ["advance", "cod", "credit"];

export function AdminBuyersClient({ buyers }: { buyers: Buyer[] }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<Buyer | null>(null);
  const [busy, setBusy] = useState(false);

  const changeStatus = async (b: Buyer, status: BuyerStatus) => {
    setBusy(true);
    const res = await setBuyerStatusAction(b.id, status);
    setBusy(false);
    toast(res.ok ? `${b.business_name} → ${status}` : res.error, res.ok ? "success" : "error");
    if (res.ok) router.refresh();
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
            <Button variant="outline" disabled={busy} onClick={() => changeStatus(b, "approved")}>Approve</Button>
          )}
          {b.status === "approved" && (
            <Button variant="ghost" disabled={busy} onClick={() => changeStatus(b, "suspended")}>Suspend</Button>
          )}
          {b.status === "pending" && (
            <Button variant="ghost" disabled={busy} onClick={() => changeStatus(b, "rejected")}>Reject</Button>
          )}
          <Button variant="ghost" onClick={() => setEditing(b)}>Edit</Button>
        </div>
      ),
    },
  ];

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
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function BuyerEditModal({
  buyer,
  onClose,
  onSaved,
}: {
  buyer: Buyer;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const toast = useToast();
  const [credit, setCredit] = useState(String(buyer.credit_limit));
  const [priceList, setPriceList] = useState(buyer.price_list_id ?? "");
  const [terms, setTerms] = useState<PaymentTerms[]>(buyer.payment_terms);
  const [saving, setSaving] = useState(false);

  const toggleTerm = (t: PaymentTerms) =>
    setTerms((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const save = async () => {
    setSaving(true);
    const res = await updateBuyerAction(buyer.id, {
      creditLimit: Math.max(0, parseInt(credit || "0", 10) || 0),
      priceListId: priceList.trim() || null,
      paymentTerms: terms,
    });
    setSaving(false);
    if (res.ok) onSaved(`Updated ${buyer.business_name}`);
    else toast(res.error, "error");
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
        <Button onClick={save} disabled={saving} className="mt-2">{saving ? "Saving…" : "Save changes"}</Button>
      </div>
    </Modal>
  );
}
