import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/data/catalog";
import { ProductView } from "@/components/product/ProductView";
import { getCurrentBuyer } from "@/lib/data/buyers";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug, false);
  if (!product) return { title: "Product not found — RG Enterprises" };
  return {
    title: `${product.name} — RG Enterprises`,
    description: (product.description || `${product.fabric} · wholesale`).slice(0, 160),
    openGraph: product.thumbnail ? { images: [{ url: product.thumbnail }] } : undefined,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const buyer = await getCurrentBuyer();
  const approved = buyer?.status === "approved";
  const product = await getProduct(slug, approved);
  if (!product) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: product.images,
    category: product.category,
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: "RG Enterprises" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductView product={product} approved={approved} buyerPrice={null} />
    </>
  );
}
