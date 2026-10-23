"use client";

// Client session context. The value is resolved server-side (from the auth cookie) in the root
// layout and passed down, so the client never reads/forges identity.

import { createContext, useContext } from "react";
import type { BuyerStatus, PaymentTerms, StateCode } from "./types";

export interface ClientSession {
  loggedIn: boolean;
  id: string | null;
  businessName: string | null;
  status: BuyerStatus | null;
  approved: boolean;
  state: StateCode | null;
  paymentTerms: PaymentTerms[];
  creditLimit: number;
}

const EMPTY: ClientSession = {
  loggedIn: false,
  id: null,
  businessName: null,
  status: null,
  approved: false,
  state: null,
  paymentTerms: [],
  creditLimit: 0,
};

const SessionContext = createContext<ClientSession>(EMPTY);

export function SessionProvider({ value, children }: { value: ClientSession; children: React.ReactNode }) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): ClientSession {
  return useContext(SessionContext);
}
