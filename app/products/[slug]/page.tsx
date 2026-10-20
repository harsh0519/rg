"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getProduct } from "@/lib/mockApi";
import { useSession } from "@/lib/session";
import { ProductView } from "@/components/product/ProductView";
import { Skeleton } from "@/components/ui/Skeleton";
import { ButtonLink } from "@/components/ui/Button";
import type { ProductDetail } from "@/lib/types";

type State = "loading" | "ready" | "notfound" | "error";

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { approved } = useSession();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    let active = true;
    getProduct(slug)
      .then((p) => {
        if (!active) return;
        if (!p) {
          setState("notfound");
          return;
        }
        setProduct(p);
        setState("ready");
      })
      .catch(() => active && setState("error"));
    return () => {
      active = false;
    };
  }, [slug, approved]);

  if (state === "loading") {
    return (
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2">
        <Skeleton className="aspect-[4/5] w-full" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (state === "notfound") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-head">Product not found</h1>
        <p className="mt-4 font-serif text-muted">This product may have been removed from the catalog.</p>
        <ButtonLink href="/catalog" className="mt-6">Back to catalog</ButtonLink>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-head">Couldn’t load this product</h1>
        <p className="mt-4 font-serif text-muted">Please try again.</p>
        <ButtonLink href="/catalog" className="mt-6">Back to catalog</ButtonLink>
      </div>
    );
  }

  return product ? <ProductView product={product} /> : null;
}
