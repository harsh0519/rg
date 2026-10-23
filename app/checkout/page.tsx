"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useSession } from "@/lib/session";
import { placeOrder } from "@/lib/actions/order";
import { formatINR } from "@/lib/format";
import { runSchema, validatePhone, validatePincode, required } from "@/lib/validation";
import { Field, SelectField, TextArea } from "@/components/ui/Field";
import { Button, ButtonLink } from "@/components/ui/Button";
import type { Cart, PaymentTerms } from "@/lib/types";

const TERM_LABEL: Record<PaymentTerms, string> = {
  advance: "Advance payment",
  cod: "Cash on delivery",
  credit: "Credit (per terms)",
};

export default function CheckoutPage() {
  const { loggedIn, approved, businessName, state, paymentTerms } = useSession();
  const { cart, reload } = useCart();
  const [placed, setPlaced] = useState<{ order_no: string; total: number } | null>(null);

  if (placed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-head">Order placed</h1>
        <p className="mt-4 font-serif text-lead">
          {placed.order_no} · {formatINR(placed.total)}
        </p>
        <p className="mt-2 font-serif text-muted">
          We’ve received your order and will confirm stock and dispatch. Your invoice is ready in your account.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <ButtonLink href="/account/orders">View orders</ButtonLink>
          <ButtonLink href="/catalog" variant="outline">Continue shopping</ButtonLink>
        </div>
      </div>
    );
  }

  if (!loggedIn || !approved) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-head">Checkout is for approved buyers</h1>
        <ButtonLink href="/login" className="mt-6">Log in</ButtonLink>
      </div>
    );
  }

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-head">Nothing to check out</h1>
        <ButtonLink href="/catalog" className="mt-6">Browse catalog</ButtonLink>
      </div>
    );
  }

  return (
    <CheckoutForm
      businessName={businessName}
      state={state}
      paymentTerms={paymentTerms}
      cart={cart}
      onPlaced={async (res) => {
        await reload();
        setPlaced(res);
      }}
    />
  );
}

function CheckoutForm({
  businessName,
  state,
  paymentTerms,
  cart,
  onPlaced,
}: {
  businessName: string | null;
  state: string | null;
  paymentTerms: PaymentTerms[];
  cart: Cart;
  onPlaced: (res: { order_no: string; total: number }) => void;
}) {
  const terms = paymentTerms.length ? paymentTerms : (["advance"] as PaymentTerms[]);
  const [form, setForm] = useState({
    name: businessName ?? "",
    line1: "",
    city: "",
    state: state ?? "",
    pincode: "",
    phone: "",
    po_number: "",
    notes: "",
  });
  const [freight, setFreight] = useState<"standard" | "express" | "self_pickup">("standard");
  const [selectedTerms, setSelectedTerms] = useState<PaymentTerms>(terms[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [placing, setPlacing] = useState(false);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = runSchema(form, {
      name: required("Name"),
      line1: required("Address"),
      city: required("City"),
      state: required("State"),
      pincode: validatePincode,
      phone: validatePhone,
      po_number: required("PO number"),
    });
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setPlacing(true);
    setFormError("");
    try {
      const res = await placeOrder({
        address: {
          name: form.name,
          line1: form.line1,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          phone: form.phone,
        },
        payment_terms: selectedTerms,
        po_number: form.po_number,
        freight,
        notes: form.notes,
      });
      if (!res.ok) {
        setFormError(res.error);
        return;
      }
      onPlaced(res);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-head">Checkout</h1>

      <form onSubmit={submit} className="mt-8 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-10">
          <section>
            <h2 className="mb-4 text-lead font-display">Shipping address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field id="name" label="Business / name" value={form.name} error={errors.name} onChange={(e) => set({ name: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Field id="line1" label="Address" value={form.line1} error={errors.line1} onChange={(e) => set({ line1: e.target.value })} />
              </div>
              <Field id="city" label="City" value={form.city} error={errors.city} onChange={(e) => set({ city: e.target.value })} />
              <Field id="state" label="State code" hint="e.g. MH, DL" value={form.state} error={errors.state} onChange={(e) => set({ state: e.target.value.toUpperCase() })} />
              <Field id="pincode" label="Pincode" inputMode="numeric" value={form.pincode} error={errors.pincode} onChange={(e) => set({ pincode: e.target.value })} />
              <Field id="phone" label="Phone" inputMode="numeric" value={form.phone} error={errors.phone} onChange={(e) => set({ phone: e.target.value })} />
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-lead font-display">Freight</h2>
            <div className="flex flex-wrap gap-3">
              {([
                ["standard", "Standard freight"],
                ["express", "Express"],
                ["self_pickup", "Self pickup"],
              ] as const).map(([val, label]) => (
                <label key={val} className={`cursor-pointer px-4 py-2.5 font-serif ${freight === val ? "bg-accent text-accent-ink" : "bg-surface"}`}>
                  <input type="radio" name="freight" className="sr-only" checked={freight === val} onChange={() => setFreight(val)} />
                  {label}
                </label>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-lead font-display">Payment & order details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField id="terms" label="Payment terms" value={selectedTerms} onChange={(e) => setSelectedTerms(e.target.value as PaymentTerms)}>
                {terms.map((t) => (
                  <option key={t} value={t}>{TERM_LABEL[t]}</option>
                ))}
              </SelectField>
              <Field id="po" label="PO number" value={form.po_number} error={errors.po_number} onChange={(e) => set({ po_number: e.target.value })} />
              <div className="sm:col-span-2">
                <TextArea id="notes" label="Order notes" hint="optional" value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
              </div>
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside className="h-fit bg-surface p-6">
          <h2 className="text-lead font-display">Order summary</h2>
          <dl className="mt-4 flex flex-col gap-2 font-serif tnum">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd>{formatINR(cart.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">GST{cart.tax?.interstate ? " (IGST)" : " (CGST+SGST)"}</dt>
              <dd>{formatINR(cart.tax?.total_tax ?? 0)}</dd>
            </div>
            <div className="mt-2 flex justify-between border-t border-ink/15 pt-3 text-lead">
              <dt className="font-display">Total</dt>
              <dd className="font-display">{formatINR(cart.total)}</dd>
            </div>
          </dl>
          {formError && <p className="mt-3 font-serif text-small text-danger">{formError}</p>}
          <Button type="submit" size="lg" className="mt-5 w-full" disabled={placing}>
            {placing ? "Placing…" : "Place order"}
          </Button>
          <p className="mt-3 font-serif text-small text-muted">
            Payment is handled offline per your terms. No card is charged here.
          </p>
        </aside>
      </form>
    </div>
  );
}
