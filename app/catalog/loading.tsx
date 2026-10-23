import { ProductCardSkeleton } from "@/components/ui/Skeleton";

export default function CatalogLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="h-8 w-40 animate-pulse bg-surface" />
      <div className="mt-8 flex gap-10">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="h-80 animate-pulse bg-surface" />
        </aside>
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
