import type { Metadata } from "next";
import { Libre_Franklin, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/lib/session";
import { CartProvider } from "@/lib/cart";
import { ToastProvider } from "@/components/ui/Toast";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${serif.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <SessionProvider>
          <CartProvider>
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
