"use client";

import { useState } from "react";
import { postRfq } from "@/lib/mockApi";
import { runSchema, required, validateEmail } from "@/lib/validation";
import { useToast } from "@/components/ui/Toast";
import { Field, TextArea } from "@/components/ui/Field";
import { Button, ButtonLink } from "@/components/ui/Button";

export default function RfqPage() {
  const toast = useToast();
  const [form, setForm] = useState({
    business_name: "",
    contact: "",
    product_interest: "",
    quantities: "",
    details: "",
  });
  const [privateLabel, setPrivateLabel] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    // upload is mocked — keep only the file names
    setAttachments(Array.from(e.target.files ?? []).map((f) => f.name));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = runSchema(form, {
      business_name: required("Business name"),
      contact: validateEmail,
      product_interest: required("Product of interest"),
      quantities: required("Quantities"),
      details: required("Details"),
    });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await postRfq({ ...form, private_label: privateLabel, attachments });
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-head">Quote request sent</h1>
        <p className="mt-4 font-serif text-lead text-muted">
          Our team will review your requirement and respond with pricing. Expect a reply within two
          working days.
        </p>
        <ButtonLink href="/catalog" className="mt-6">Browse the catalog</ButtonLink>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-head">Request a quote</h1>
      <p className="mt-3 font-serif text-muted">
        For custom quantities, private label or special pricing. Prefer to browse?{" "}
        <button
          type="button"
          onClick={() => toast("Line-sheet PDF is mocked — wire to the catalog export.")}
          className="text-accent hover:underline"
        >
          Download the line sheet
        </button>
        .
      </p>

      <form onSubmit={submit} className="mt-8 grid gap-4 sm:grid-cols-2">
        <Field id="business_name" label="Business name" value={form.business_name} error={errors.business_name} onChange={(e) => set({ business_name: e.target.value })} />
        <Field id="contact" label="Contact email" type="email" value={form.contact} error={errors.contact} onChange={(e) => set({ contact: e.target.value })} />
        <div className="sm:col-span-2">
          <Field id="product_interest" label="Product of interest" value={form.product_interest} error={errors.product_interest} onChange={(e) => set({ product_interest: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <Field id="quantities" label="Quantities" hint="e.g. 1,200 pcs across M–XXL" value={form.quantities} error={errors.quantities} onChange={(e) => set({ quantities: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <TextArea id="details" label="Details" value={form.details} error={errors.details} onChange={(e) => set({ details: e.target.value })} />
        </div>
        <label className="sm:col-span-2 flex items-center gap-2 font-serif">
          <input type="checkbox" checked={privateLabel} onChange={(e) => setPrivateLabel(e.target.checked)} className="accent-accent" />
          This is a private-label enquiry
        </label>
        <div className="sm:col-span-2">
          <span className="mb-1.5 block font-display text-small font-bold uppercase tracking-tight">Attachments</span>
          <input type="file" multiple onChange={onFiles} className="font-serif text-small" />
          {attachments.length > 0 && (
            <p className="mt-1 font-serif text-small text-muted">{attachments.join(", ")}</p>
          )}
        </div>
        <div className="sm:col-span-2 mt-2">
          <Button type="submit" size="lg" disabled={busy}>
            {busy ? "Sending…" : "Send request"}
          </Button>
        </div>
      </form>
    </div>
  );
}
