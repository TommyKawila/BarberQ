import type { Metadata } from "next";
import { AdminAuthProvider } from "@/lib/admin/admin-auth-context";
import { AdminChrome } from "@/components/admin/AdminChrome";
import { ownerPwaMetadata } from "@/lib/pwa/owner-manifest";

/** Owner/staff "Add to Home Screen" opens /owner, not the marketing sale page. */
export const metadata: Metadata = {
  ...ownerPwaMetadata,
};

/** Shop-scoped admin: slug/brand come from [shop]/layout; chrome keeps nav mounted. */
export default function ShopAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminChrome>{children}</AdminChrome>
    </AdminAuthProvider>
  );
}
