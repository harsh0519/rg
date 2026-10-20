"use client";

import { useEffect, useRef, useState } from "react";
import { applyBuyer } from "@/lib/mockApi";
import {
  runSchema,
  required,
  validateEmail,
  validateGSTIN,
  validatePhone,
  validatePincode,
} from "@/lib/validation";
import { Field, SelectField, TextArea } from "@/components/ui/Field";
import { Button, ButtonLink } from "@/components/ui/Button";
import type { BuyerApplication } from "@/lib/types";

const DRAFT_KEY = "rg_apply_draft";

const EMPTY = {
  business_name: "",
  contact_name: "",
  phone: "",
  email: "",
  gstin: "",
  address: "",
  pincode: "",
  state: "",
  business_type: "retailer" as BuyerApplication["business_type"],
};

export default function ApplyPage() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const loaded = useRef(false);

  // load draft once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      // one-time hydration of the saved draft from an external store (localStorage)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setForm({ ...EMPTY, ...JSON.parse(raw) });
    } catch {}
    loaded.current = true;
  }, []);

  // autosave draft (doc §7: draft autosave on the apply form) — side effect only
  useEffect(() => {
    if (!loaded.current) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [form]);

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-head">Application received</h1>
        <p className="mt-4 font-serif text-lead text-muted">
          We’ll verify your GSTIN and business details and email you once approved. Prices and
          ordering unlock after approval.
        </p>
        <ButtonLink href="/catalog" className="mt-6">Browse the catalog</ButtonLink>
      </div>
    );
  }

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = runSchema(form, {
      business_name: required("Business name"),
      contact_name: required("Contact name"),
      phone: validatePhone,
      email: validateEmail,
      gstin: validateGSTIN,
      address: required("Address"),
      pincode: validatePincode,
      state: required("State"),
    });
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      await applyBuyer({ ...form, gstin: form.gstin.toUpperCase() });
      localStorage.removeItem(DRAFT_KEY);
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-head">Apply to buy</h1>
      <p className="mt-3 font-serif text-muted">
        Approved retail buyers get wholesale pricing, GST invoicing and credit terms. Your progress
        autosaves.
      </p>

      <form onSubmit={submit} className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field id="business_name" label="Business name" value={form.business_name} error={errors.business_name} onChange={(e) => set({ business_name: e.target.value })} />
        </div>
        <Field id="contact_name" label="Contact name" value={form.contact_name} error={errors.contact_name} onChange={(e) => set({ contact_name: e.target.value })} />
        <Field id="phone" label="Phone" inputMode="numeric" value={form.phone} error={errors.phone} onChange={(e) => set({ phone: e.target.value })} />
        <Field id="email" label="Email" type="email" value={form.email} error={errors.email} onChange={(e) => set({ email: e.target.value })} />
        <Field id="gstin" label="GSTIN" hint="15 characters" value={form.gstin} error={errors.gstin} onChange={(e) => set({ gstin: e.target.value.toUpperCase() })} />
        <div className="sm:col-span-2">
          <TextArea id="address" label="Address" value={form.address} error={errors.address} onChange={(e) => set({ address: e.target.value })} />
        </div>
        <Field id="pincode" label="Pincode" inputMode="numeric" value={form.pincode} error={errors.pincode} onChange={(e) => set({ pincode: e.target.value })} />
        <Field id="state" label="State code" hint="e.g. MH, DL" value={form.state} error={errors.state} onChange={(e) => set({ state: e.target.value.toUpperCase() })} />
        <div className="sm:col-span-2">
          <SelectField id="business_type" label="Business type" value={form.business_type} onChange={(e) => set({ business_type: e.target.value as BuyerApplication["business_type"] })}>
            <option value="retailer">Retailer</option>
            <option value="reseller">Reseller</option>
            <option value="distributor">Distributor</option>
            <option value="other">Other</option>
          </SelectField>
        </div>

        <div className="sm:col-span-2 mt-2 flex items-center justify-between gap-4">
          <span className="font-serif text-small text-muted">Your progress autosaves</span>
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit application"}
          </Button>
        </div>
      </form>

      <p className="mt-6 font-serif text-small text-muted">
        Already approved? <a href="/login" className="text-accent hover:underline">Log in</a>.
      </p>
    </div>
  );
}
