import { getProducts } from "@/lib/data/catalog";
import { isApprovedBuyer } from "@/lib/data/buyers";
import { CatalogClient } from "./CatalogClient";

export const metadata = {
  title: "Catalog — RG Enterprises",
  description: "Wholesale apparel and home linen. Apply for a trade account to see pricing.",
};

export default async function CatalogPage() {
  const approved = await isApprovedBuyer();
  const products = await getProducts(approved);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-head">Catalog</h1>
          <p className="mt-2 font-serif text-muted">
            {approved ? "Your wholesale rates are shown." : "Log in as an approved buyer to see pricing."}
          </p>
        </div>
      </header>

      <div className="mt-6">
        <CatalogClient products={products} />
      </div>
    </div>
  );
}
