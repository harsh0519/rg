"use client";

import { useEffect, useState } from "react";
import { getRfqs, setRfqStatus } from "@/lib/adminApi";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import type { RfqRecord } from "@/lib/types";

const STATUS_STYLE: Record<RfqRecord["status"], string> = {
  open: "bg-surface text-ink",
  quoted: "bg-accent text-accent-ink",
  closed: "bg-field text-field-ink",
};

export default function AdminRfqPage() {
  const toast = useToast();
  const [rfqs, setRfqs] = useState<RfqRecord[] | null>(null);

  const load = () => getRfqs().then(setRfqs);
  useEffect(() => {
    load();
  }, []);

  const advance = async (r: RfqRecord, status: RfqRecord["status"]) => {
    await setRfqStatus(r.id, status);
    toast(`${r.id} → ${status}`);
    load();
  };

  if (!rfqs) return <Skeleton className="h-64 w-full" />;
  if (rfqs.length === 0) return <p className="font-serif text-muted">No RFQs in the inbox.</p>;

  return (
    <div className="flex flex-col gap-5">
      {rfqs.map((r) => (
        <article key={r.id} className="bg-surface p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-lead">{r.business_name}</h2>
              <p className="mt-1 font-serif text-small text-muted">
                {r.contact} · received {r.received_at}
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
            {r.attachments.length > 0 && (
              <div className="sm:col-span-2">
                <dt className="text-small text-muted">Attachments</dt>
                <dd>{r.attachments.join(", ")}</dd>
              </div>
            )}
          </dl>

          <div className="mt-5 flex gap-3">
            {r.status === "open" && <Button onClick={() => advance(r, "quoted")}>Mark quoted</Button>}
            {r.status !== "closed" && (
              <Button variant="ghost" onClick={() => advance(r, "closed")}>Close</Button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
