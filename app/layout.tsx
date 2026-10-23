import type { Metadata } from "next";
import { Libre_Franklin, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { SessionProvider, type ClientSession } from "@/lib/session";
import { CartProvider } from "@/lib/cart";
import { ToastProvider } from "@/components/ui/Toast";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getCurrentBuyer } from "@/lib/data/buyers";
import { getServerCart } from "@/lib/data/cart";

const display = Libre_Franklin({
  variable: "--ff-display",
  subsets: ["latin"],
  weight: ["700"],
});

const serif = Source_Serif_4({
  variable: "--ff-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "RG Enterprises — Wholesale Apparel",
  description:
    "B2B wholesale clothing for approved retail buyers. Bulk ordering by size/colour matrix, tiered pricing and GST invoicing.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const buyer = await getCurrentBuyer();
  const initialCart = await getServerCart();
  const session: ClientSession = {
    loggedIn: !!buyer,
    id: buyer?.id ?? null,
    businessName: buyer?.businessName ?? null,
    status: buyer?.status ?? null,
    approved: buyer?.status === "approved",
    state: buyer?.state ?? null,
    paymentTerms: buyer?.paymentTerms ?? [],
    creditLimit: buyer?.creditLimit ?? 0,
  };

  return (
    <html lang="en" className={`${display.variable} ${serif.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <SessionProvider value={session}>
          <CartProvider initialCart={initialCart}>
            <ToastProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </ToastProvider>
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
