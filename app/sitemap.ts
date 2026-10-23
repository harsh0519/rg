import type { MetadataRoute } from "next";
import { getProductSlugs } from "@/lib/data/catalog";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getProductSlugs().catch(() => [] as string[]);
  const now = new Date();
  const staticRoutes = ["", "/catalog", "/apply", "/login", "/rfq"].map((p) => ({
    url: `${BASE}${p}`,
    lastModified: now,
  }));
  const products = slugs.map((s) => ({ url: `${BASE}/products/${s}`, lastModified: now }));
  return [...staticRoutes, ...products];
}
