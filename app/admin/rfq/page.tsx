import { getAdminRfqs } from "@/lib/data/admin";
import { AdminRfqClient } from "./AdminRfqClient";

export default async function AdminRfqPage() {
  const rfqs = await getAdminRfqs();
  return <AdminRfqClient rfqs={rfqs} />;
}
