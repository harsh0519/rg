import { ButtonLink } from "@/components/ui/Button";

// Placeholder for routes that land in a later milestone. On-brand, not a blank page.
export function PageStub({
  title,
  milestone,
  summary,
}: {
  title: string;
  milestone: string;
  summary: string;
}) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-24 sm:px-6 sm:py-32">
      <p className="font-display text-small font-bold uppercase tracking-tight text-accent">{milestone}</p>
      <h1 className="mt-3 text-head">{title}</h1>
      <p className="mt-5 font-serif text-lead text-muted">{summary}</p>
      <div className="mt-8 flex gap-4">
        <ButtonLink href="/" variant="outline">Back home</ButtonLink>
        <ButtonLink href="/catalog">Catalog</ButtonLink>
      </div>
    </section>
  );
}
