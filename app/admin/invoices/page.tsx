import { getAdminInvoices } from "@/lib/data/admin";
import { AdminInvoicesClient } from "./AdminInvoicesClient";

export default async function AdminInvoicesPage() {
  const invoices = await getAdminInvoices();
  return <AdminInvoicesClient invoices={invoices} />;
}
