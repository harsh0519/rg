"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setRfqStatusAction } from "@/lib/actions/admin";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import type { RfqRecord } from "@/lib/types";

const STATUS_STYLE: Record<RfqRecord["status"], string> = {
  open: "bg-surface text-ink",
  quoted: "bg-accent text-accent-ink",
  closed: "bg-field text-field-ink",
};

export function AdminRfqClient({ rfqs }: { rfqs: RfqRecord[] }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const advance = async (r: RfqRecord, status: RfqRecord["status"]) => {
    setBusy(true);
    const res = await setRfqStatusAction(r.id, status);
    setBusy(false);
    toast(res.ok ? `${r.business_name} → ${status}` : res.error, res.ok ? "success" : "error");
    if (res.ok) router.refresh();
  };

  if (rfqs.length === 0) return <p className="font-serif text-muted">No RFQs in the inbox.</p>;

  return (
    <div className="flex flex-col gap-5">
      {rfqs.map((r) => (
        <article key={r.id} className="bg-surface p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-lead">{r.business_name}</h2>
              <p className="mt-1 font-serif text-small text-muted">
                {r.contact} · received {r.received_at?.slice(0, 10)}
                {r.private_label ? " · private label" : ""}
              </p>
            </div>
            <span className={`inline-flex px-2.5 py-1 font-display text-small font-bold uppercase tracking-tight ${STATUS_STYLE[r.status]}`}>
              {r.status}
            </span>
          </div>

          <dl className="mt-4 grid gap-2 font-serif sm:grid-cols-2">
            <div>
              <dt className="text-small text-muted">Product</dt>
              <dd>{r.product_interest}</dd>
            </div>
            <div>
              <dt className="text-small text-muted">Quantities</dt>
              <dd>{r.quantities}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-small text-muted">Details</dt>
              <dd>{r.details}</dd>
            </div>
          </dl>

          <div className="mt-5 flex gap-3">
            {r.status === "open" && <Button disabled={busy} onClick={() => advance(r, "quoted")}>Mark quoted</Button>}
            {r.status !== "closed" && (
              <Button variant="ghost" disabled={busy} onClick={() => advance(r, "closed")}>Close</Button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
