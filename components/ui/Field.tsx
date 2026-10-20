import type { ComponentProps, ReactNode } from "react";

// Labelled inputs with inline errors (doc §7 forms, accessibility: labelled inputs).
// Form fields keep native borders — allowed by the taste inspector.

const fieldBase =
  "w-full bg-paper border border-ink/25 px-3 py-2.5 font-serif text-body text-ink " +
  "focus:border-accent focus:outline-none aria-[invalid=true]:border-danger";

function labelRow(id: string, label: string, error?: string, hint?: string) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <label htmlFor={id} className="font-display text-small font-bold uppercase tracking-tight">
        {label}
      </label>
      {error ? (
        <span className="text-small text-danger">{error}</span>
      ) : hint ? (
        <span className="text-small text-muted">{hint}</span>
      ) : null}
    </div>
  );
}

interface Base {
  id: string;
  label: string;
  error?: string;
  hint?: string;
}

export function Field({
  id,
  label,
  error,
  hint,
  ...props
}: Base & ComponentProps<"input">) {
  return (
    <div>
      {labelRow(id, label, error, hint)}
      <input id={id} aria-invalid={!!error} className={fieldBase} {...props} />
    </div>
  );
}

export function TextArea({
  id,
  label,
  error,
  hint,
  ...props
}: Base & ComponentProps<"textarea">) {
  return (
    <div>
      {labelRow(id, label, error, hint)}
      <textarea id={id} aria-invalid={!!error} className={`${fieldBase} min-h-24`} {...props} />
    </div>
  );
}

export function SelectField({
  id,
  label,
  error,
  hint,
  children,
  ...props
}: Base & ComponentProps<"select"> & { children: ReactNode }) {
  return (
    <div>
      {labelRow(id, label, error, hint)}
      <select id={id} aria-invalid={!!error} className={fieldBase} {...props}>
        {children}
      </select>
    </div>
  );
}
