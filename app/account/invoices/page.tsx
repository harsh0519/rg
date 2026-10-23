import { getBuyerInvoices } from "@/lib/data/orders";
import { InvoicesClient } from "./InvoicesClient";

export default async function InvoicesPage() {
  const invoices = await getBuyerInvoices();
  return <InvoicesClient invoices={invoices} />;
}
