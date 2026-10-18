import { Noto_Sans_Thai } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { BARBERQX_BRAND } from "@/lib/brand/barberqx";
import "./globals.css";

const notoThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "600", "700", "800"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://example.com";

export const metadata: Metadata = {
  title: "ClipperQ",
  description: "ระบบจองคิวร้านตัดผมผ่าน LINE",
  applicationName: "ClipperQ",
  metadataBase: new URL(appUrl),
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/brand/clipperq/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/clipperq/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/clipperq/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/brand/clipperq/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/brand/clipperq/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "ClipperQ",
    description: "ระบบจองคิวร้านตัดผมผ่าน LINE",
    siteName: "ClipperQ",
    images: [{ url: BARBERQX_BRAND.assets.og, width: 1200, height: 630, alt: "ClipperQ" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClipperQ",
    description: "ระบบจองคิวร้านตัดผมผ่าน LINE",
    images: [BARBERQX_BRAND.assets.og],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: BARBERQX_BRAND.gold,
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
