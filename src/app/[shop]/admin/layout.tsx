import { AdminAuthProvider } from "@/lib/admin/admin-auth-context";
import { AdminChrome } from "@/components/admin/AdminChrome";

/** Shop-scoped admin: slug/brand come from [shop]/layout; chrome keeps nav mounted. */
export default function ShopAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminChrome>{children}</AdminChrome>
    </AdminAuthProvider>
  );
}
