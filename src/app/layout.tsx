import { Noto_Sans_Thai } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { AppHeader } from "@/components/layout/AppHeader";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { ShopBrandProvider } from "@/lib/brand/shop-brand";
import "./globals.css";

const notoThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "BarberQ",
  description: "Barbershop booking prototype",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${notoThai.className} h-full antialiased`}>
      <body className="min-h-full bg-zinc-950 text-zinc-50">
        <LocaleProvider>
          <ShopBrandProvider>
            <div className="mx-auto min-h-full w-full max-w-lg pb-[env(safe-area-inset-bottom)]">
              <AppHeader />
              {children}
            </div>
          </ShopBrandProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
