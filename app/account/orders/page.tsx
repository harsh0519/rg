import { getBuyerOrders } from "@/lib/data/orders";
import { OrdersClient } from "./OrdersClient";

export default async function OrdersPage() {
  const orders = await getBuyerOrders();
  return <OrdersClient orders={orders} />;
}
