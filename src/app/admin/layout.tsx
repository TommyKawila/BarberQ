import { AppHeader } from "@/components/layout/AppHeader";
import { AdminAuthProvider } from "@/lib/admin/admin-auth-context";
import { AdminChrome } from "@/components/admin/AdminChrome";
import { ShopBrandProvider } from "@/lib/brand/shop-brand";
import { ShopSlugProvider } from "@/lib/shop/shop-slug-context";

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
