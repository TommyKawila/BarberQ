import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { ShopBrandProvider } from "@/lib/brand/shop-brand";
import { getStore } from "@/lib/data";
import { ShopSlugProvider } from "@/lib/shop/shop-slug-context";

export default async function ShopLayout({
  children,
  params,
}: LayoutProps<"/[shop]">) {
  const { shop } = await params;
  const record = await getStore().getShopBySlug(shop);
  if (!record || record.status !== "active") {
    notFound();
  }

  return (
    <ShopSlugProvider shopSlug={shop}>
      <ShopBrandProvider shopSlug={shop}>
        <AppHeader />
        {children}
      </ShopBrandProvider>
    </ShopSlugProvider>
  );
}
