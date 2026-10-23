import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInvoiceById } from "@/lib/data/orders";
import { getSiteSettings } from "@/lib/data/site";
import { formatINR, formatQty } from "@/lib/format";
import { ButtonLink } from "@/components/ui/Button";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = { title: "Invoice — RG Enterprises", robots: { index: false } };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [invoice, settings] = await Promise.all([getInvoiceById(id), getSiteSettings()]);
  if (!invoice) notFound();

  const g = invoice.gst;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* hide the shared chrome when printing */}
      <style>{`@media print { header, footer, .no-print { display: none !important } body { background: #fff } }`}</style>

      <div className="mb-6 flex items-center justify-between gap-4 no-print">
        <ButtonLink href="/account/invoices" variant="outline">← Invoices</ButtonLink>
        <PrintButton />
      </div>

      <article className="bg-paper p-8 sm:p-10">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-ink/15 pb-6">
          <div>
            <h1 className="font-display text-head">{settings.brandName}</h1>
            <p className="mt-1 font-serif text-small text-muted">
              GSTIN {settings.sellerGstin ?? "—"} · State {settings.sellerState}
            </p>
            {settings.contact?.addressLines?.length ? (
              <p className="font-serif text-small text-muted">{settings.contact.addressLines.join(", ")}</p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="font-display text-lead font-bold uppercase tracking-tight">Tax Invoice</p>
            <p className="mt-1 font-serif text-small tnum">{invoice.invoiceNo}</p>
            <p className="font-serif text-small text-muted">Issued {invoice.issuedAt?.slice(0, 10)}</p>
          </div>
        </header>

        <div className="grid gap-6 py-6 font-serif text-small sm:grid-cols-2">
          <div>
            <p className="text-muted">Bill to</p>
            <p className="font-semibold">{invoice.buyer?.businessName ?? "—"}</p>
            {invoice.buyer?.gstin && <p>GSTIN {invoice.buyer.gstin}</p>}
            {invoice.buyer?.address && <p className="text-muted">{invoice.buyer.address}</p>}
            {invoice.address && (
              <p className="mt-1 text-muted">
                {invoice.address.line1}, {invoice.address.city}, {invoice.address.state} {invoice.address.pincode}
              </p>
            )}
          </div>
          <div className="sm:text-right">
            <p className="text-muted">Order {invoice.orderNo}</p>
            {invoice.poNumber && <p>PO {invoice.poNumber}</p>}
            {invoice.paymentTerms && <p className="text-muted">Terms: {invoice.paymentTerms}</p>}
          </div>
        </div>

        <table className="w-full border-collapse font-serif text-small">
          <thead>
            <tr className="border-y border-ink/20 text-left">
              <th className="py-2 pr-2">Item</th>
              <th className="py-2 px-2">HSN</th>
              <th className="py-2 px-2 text-right">Qty</th>
              <th className="py-2 px-2 text-right">Rate</th>
              <th className="py-2 pl-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((l, i) => (
              <tr key={i} className="border-b border-ink/10">
                <td className="py-2 pr-2">
                  {l.productName}
                  <span className="text-muted"> · {l.colour} {l.size} · {l.sku}</span>
                </td>
                <td className="py-2 px-2 tnum">{l.hsn ?? "—"}</td>
                <td className="py-2 px-2 text-right tnum">{formatQty(l.qty)}</td>
                <td className="py-2 px-2 text-right tnum">{formatINR(l.unitPrice)}</td>
                <td className="py-2 pl-2 text-right tnum">{formatINR(l.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-xs font-serif text-small tnum">
            <div className="flex justify-between py-1">
              <dt className="text-muted">Taxable value</dt>
              <dd>{formatINR(g?.taxable ?? 0)}</dd>
            </div>
            {g?.interstate ? (
              <div className="flex justify-between py-1">
                <dt className="text-muted">IGST</dt>
                <dd>{formatINR(g.igst)}</dd>
              </div>
            ) : (
              <>
                <div className="flex justify-between py-1">
                  <dt className="text-muted">CGST</dt>
                  <dd>{formatINR(g?.cgst ?? 0)}</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-muted">SGST</dt>
                  <dd>{formatINR(g?.sgst ?? 0)}</dd>
                </div>
              </>
            )}
            <div className="mt-1 flex justify-between border-t border-ink/20 pt-2 text-lead">
              <dt className="font-display">Total</dt>
              <dd className="font-display">{formatINR(invoice.total)}</dd>
            </div>
          </dl>
        </div>

        <p className="mt-8 font-serif text-small text-muted">
          Status: {invoice.status}. Payment handled offline per agreed terms. This is a
          computer-generated invoice.
        </p>
      </article>
    </div>
  );
}
