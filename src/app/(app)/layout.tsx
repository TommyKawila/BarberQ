import { PhoneShell } from "@/components/layout/PhoneShell";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return <PhoneShell>{children}</PhoneShell>;
}
