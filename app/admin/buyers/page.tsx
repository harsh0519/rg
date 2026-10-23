import { getAdminBuyers } from "@/lib/data/admin";
import { AdminBuyersClient } from "./AdminBuyersClient";

export default async function AdminBuyersPage() {
  const buyers = await getAdminBuyers();
  return <AdminBuyersClient buyers={buyers} />;
}
