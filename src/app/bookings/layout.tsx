import { AppHeader } from "@/components/layout/AppHeader";
import { ShopBrandProvider } from "@/lib/brand/shop-brand";
import { ShopSlugProvider } from "@/lib/shop/shop-slug-context";

export default function BookingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ShopSlugProvider shopSlug="phinxstudio">
      <ShopBrandProvider shopSlug="phinxstudio">
        <AppHeader />
        {children}
      </ShopBrandProvider>
    </ShopSlugProvider>
  );
}
