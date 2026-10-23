"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/actions/auth";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await login({ email, password });
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }
    router.push("/catalog");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-head">Log in</h1>
      <p className="mt-3 font-serif text-muted">Sign in to your wholesale account to see prices and order.</p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        <Field id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Field id="password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="font-serif text-small text-danger">{error}</p>}
        <Button type="submit" size="lg" disabled={busy} className="mt-2">
          {busy ? "Signing in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 font-serif text-small text-muted">
        No account yet? <a href="/apply" className="text-accent underline">Apply to buy</a>.
      </p>
    </div>
  );
}
