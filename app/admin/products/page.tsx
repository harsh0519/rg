import { getAdminProducts } from "@/lib/data/admin";
import { AdminProductsClient } from "./AdminProductsClient";

export default async function AdminProductsPage() {
  const products = await getAdminProducts();
  return <AdminProductsClient products={products} />;
}
