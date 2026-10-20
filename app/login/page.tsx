"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

// Mock login: there is no real auth backend, so signing in puts the session into the
// approved demo buyer. The dev "View as" switcher in the footer covers other statuses.
export default function LoginPage() {
  const router = useRouter();
  const { changeStatus } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await changeStatus("approved");
    router.push("/catalog");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-head">Log in</h1>
      <p className="mt-3 font-serif text-muted">Sign in to your wholesale account to see prices and order.</p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        <Field id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Field id="password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit" size="lg" disabled={busy} className="mt-2">
          {busy ? "Signing in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 font-serif text-small text-muted">
        No account yet? <a href="/apply" className="text-accent hover:underline">Apply to buy</a>.
      </p>
    </div>
  );
}
