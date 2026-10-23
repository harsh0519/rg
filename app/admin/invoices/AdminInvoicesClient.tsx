"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setInvoiceStatusAction } from "@/lib/actions/admin";
import { useToast } from "@/components/ui/Toast";
import { formatINR } from "@/lib/format";
import { DataTable, type Column } from "@/components/ui/DataTable";
import type { AdminInvoice } from "@/lib/data/admin";

const STATUSES: AdminInvoice["status"][] = ["unpaid", "paid", "overdue"];

export function AdminInvoicesClient({ invoices }: { invoices: AdminInvoice[] }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const setStatus = async (inv: AdminInvoice, status: AdminInvoice["status"]) => {
    setBusy(true);
    const res = await setInvoiceStatusAction(inv.id, status);
    setBusy(false);
    toast(res.ok ? `${inv.invoiceNo} → ${status}` : res.error, res.ok ? "success" : "error");
    if (res.ok) router.refresh();
  };

  const columns: Column<AdminInvoice>[] = [
    {
      key: "no",
      header: "Invoice",
      render: (i) => (
        <div>
          <p className="font-semibold">{i.invoiceNo}</p>
          <p className="text-small text-muted">{i.orderNo} · {i.buyer ?? "—"} · {i.issuedAt?.slice(0, 10)}</p>
        </div>
      ),
    },
    { key: "total", header: "Total", align: "right", render: (i) => formatINR(i.total) },
    {
      key: "status",
      header: "Payment",
      render: (i) => (
        <select
          value={i.status}
          disabled={busy}
          onChange={(e) => setStatus(i, e.target.value as AdminInvoice["status"])}
          className="border border-ink/20 bg-paper px-2 py-1.5 font-serif text-small focus:border-accent focus:outline-none"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      ),
    },
  ];

  return <DataTable columns={columns} rows={invoices} keyOf={(i) => i.id} empty="No invoices yet." />;
}
