import { OperatorNav } from "@/components/superadmin/OperatorNav";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OperatorNav />
      {children}
    </>
  );
}
