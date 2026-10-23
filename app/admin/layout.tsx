import { redirect } from "next/navigation";
import { getCurrentBuyer } from "@/lib/data/buyers";
import { AdminNav } from "@/components/admin/AdminNav";

// Server-side admin gate (doc §3.8). Role is enforced here AND coarsely in proxy.ts.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const buyer = await getCurrentBuyer();
  if (!buyer || buyer.role !== "admin") redirect("/login");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-head">Admin</h1>
        <span className="font-serif text-small text-muted">Signed in as {buyer.businessName}</span>
      </div>
      <AdminNav />
      <div className="mt-8">{children}</div>
    </div>
  );
}
