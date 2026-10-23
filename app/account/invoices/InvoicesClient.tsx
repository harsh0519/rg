import { formatINR } from "@/lib/format";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { ButtonLink } from "@/components/ui/Button";
import type { InvoiceListItem } from "@/lib/data/orders";
import type { Invoice } from "@/lib/types";

const STATUS_STYLE: Record<Invoice["status"], string> = {
  paid: "bg-field text-field-ink",
  unpaid: "bg-surface text-ink",
  overdue: "bg-danger text-accent-ink",
};

export function InvoicesClient({ invoices }: { invoices: InvoiceListItem[] }) {
  if (invoices.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-serif text-lead">No invoices yet.</p>
        <ButtonLink href="/account/orders" className="mt-5">View orders</ButtonLink>
      </div>
    );
  }

  const columns: Column<InvoiceListItem>[] = [
    { key: "no", header: "Invoice", render: (i) => <span className="font-semibold">{i.invoice_no}</span> },
    { key: "order", header: "Order", render: (i) => i.order_no },
    { key: "date", header: "Issued", render: (i) => i.issued_at?.slice(0, 10) },
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
      key: "view",
      header: "",
      align: "right",
      render: (i) => <ButtonLink href={`/account/invoices/${i.id}`} variant="outline">View</ButtonLink>,
    },
  ];

  return <DataTable columns={columns} rows={invoices} keyOf={(i) => i.id} />;
}
