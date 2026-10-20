"use client";

// Session context: loads GET /me once and exposes it to the whole app so every
// surface can gate prices/cart consistently (doc §7 "price gating UI").

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getMe, setViewStatus } from "./mockApi";
import type { BuyerStatus, Me } from "./types";

interface SessionValue {
  me: Me | null;
  loading: boolean;
  approved: boolean;
  refresh: () => Promise<void>;
  changeStatus: (status: BuyerStatus) => Promise<void>; // dev switcher
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setMe(await getMe());
    setLoading(false);
  }, []);

  const changeStatus = useCallback(
    async (status: BuyerStatus) => {
      setViewStatus(status);
      await refresh();
    },
    [refresh],
  );

  useEffect(() => {
    // initial load — state updates only in the async continuation, never synchronously
    let active = true;
    getMe().then((m) => {
      if (!active) return;
      setMe(m);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const approved = !!me && me.logged_in && me.status === "approved";

  return (
    <SessionContext.Provider value={{ me, loading, approved, refresh, changeStatus }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within <SessionProvider>");
  return ctx;
}
