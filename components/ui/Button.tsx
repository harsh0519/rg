import Link from "next/link";
import type { ComponentProps } from "react";

// Flat, one fill colour, square corners — decided once (taste house rule).
type Variant = "solid" | "outline" | "ghost";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-display font-bold uppercase tracking-tight " +
  "transition-[transform,background-color,color] duration-150 active:translate-y-px " +
  "disabled:opacity-40 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  solid: "bg-accent text-accent-ink hover:bg-field",
  outline: "bg-transparent text-ink ring-2 ring-ink ring-inset hover:bg-ink hover:text-bg",
  ghost: "bg-transparent text-ink hover:bg-surface",
};

const sizes: Record<Size, string> = {
  md: "text-small px-5 py-2.5",
  lg: "text-body px-7 py-3.5",
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
}

export function Button({
  variant = "solid",
  size = "md",
  className,
  ...props
}: CommonProps & ComponentProps<"button">) {
  return <button className={cx(base, variants[variant], sizes[size], className)} {...props} />;
}

export function ButtonLink({
  variant = "solid",
  size = "md",
  className,
  ...props
}: CommonProps & ComponentProps<typeof Link>) {
  return <Link className={cx(base, variants[variant], sizes[size], className)} {...props} />;
}
