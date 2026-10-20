"use client";

// Simple modal/drawer (shared UI per doc §7). Used for the mobile filter drawer and
// admin edit dialogs. Floating, so a shadow is allowed.

import { useEffect } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
  side = "center",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  side?: "center" | "left";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const panel =
    side === "left"
      ? "absolute inset-y-0 left-0 w-80 max-w-[85vw]"
      : "absolute left-1/2 top-1/2 w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2";

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <button
        aria-label="Close"
        className="absolute inset-0 bg-ink/50"
        onClick={onClose}
      />
      <div className={`${panel} max-h-[92vh] overflow-auto bg-bg p-6 shadow-xl`}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lead font-display">{title}</h2>
          <button
            onClick={onClose}
            className="font-display text-small font-bold uppercase tracking-tight hover:text-accent"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
