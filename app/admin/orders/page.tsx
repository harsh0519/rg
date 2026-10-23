import { getAdminOrders } from "@/lib/data/admin";
import { AdminOrdersClient } from "./AdminOrdersClient";

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();
  return <AdminOrdersClient orders={orders} />;
}
