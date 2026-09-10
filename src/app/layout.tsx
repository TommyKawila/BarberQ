import { Noto_Sans_Thai } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
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
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
