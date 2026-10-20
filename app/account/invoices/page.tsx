"use client";

import { useEffect, useState } from "react";
import { getInvoices } from "@/lib/mockApi";
import { useToast } from "@/components/ui/Toast";
import { formatINR } from "@/lib/format";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Button, ButtonLink } from "@/components/ui/Button";
import { RowSkeleton } from "@/components/ui/Skeleton";
import type { Invoice } from "@/lib/types";

const STATUS_STYLE: Record<Invoice["status"], string> = {
  paid: "bg-field text-field-ink",
  unpaid: "bg-surface text-ink",
  overdue: "bg-danger text-accent-ink",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [error, setError] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let active = true;
    getInvoices()
      .then((i) => active && setInvoices(i))
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, []);

  const download = (inv: Invoice) => {
    // mock: a real backend returns a signed pdf_url
    toast(`Invoice ${inv.invoice_no} PDF is mocked — wire pdf_url to the backend.`);
  };

  if (error) return <p className="font-serif text-muted">Couldn’t load your invoices.</p>;
  if (!invoices) {
    return (
      <div className="flex flex-col gap-3">
        <RowSkeleton />
        <RowSkeleton />
      </div>
    );
  }

  const columns: Column<Invoice>[] = [
    { key: "no", header: "Invoice", render: (i) => <span className="font-semibold">{i.invoice_no}</span> },
    { key: "order", header: "Order", render: (i) => i.order_no },
    { key: "date", header: "Issued", render: (i) => i.issued_at },
    {
      key: "status",
      header: "Status",
      render: (i) => (
        <span className={`inline-flex px-2.5 py-1 font-display text-small font-bold uppercase tracking-tight ${STATUS_STYLE[i.status]}`}>
          {i.status}
        </span>
      ),
    },
    { key: "total", header: "Total", align: "right", render: (i) => formatINR(i.total) },
    {
      key: "pdf",
      header: "",
      align: "right",
      render: (i) => (
        <Button variant="outline" onClick={() => download(i)}>PDF</Button>
      ),
    },
  ];

  if (invoices.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-serif text-lead">No invoices yet.</p>
        <ButtonLink href="/account/orders" className="mt-5">View orders</ButtonLink>
      </div>
    );
  }

  return <DataTable columns={columns} rows={invoices} keyOf={(i) => i.invoice_no} />;
}
