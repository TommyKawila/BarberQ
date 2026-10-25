import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/AppHeader";
import { AdminAuthProvider } from "@/lib/admin/admin-auth-context";
import { AdminChrome } from "@/components/admin/AdminChrome";
import { ShopBrandProvider } from "@/lib/brand/shop-brand";
import { ShopSlugProvider } from "@/lib/shop/shop-slug-context";
import { ownerPwaMetadata } from "@/lib/pwa/owner-manifest";

export const metadata: Metadata = {
  ...ownerPwaMetadata,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ShopSlugProvider shopSlug="phinxstudio">
      <ShopBrandProvider shopSlug="phinxstudio">
        <AppHeader />
        <AdminAuthProvider>
          <AdminChrome>{children}</AdminChrome>
        </AdminAuthProvider>
      </ShopBrandProvider>
    </ShopSlugProvider>
  );
}
