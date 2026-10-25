import type { Metadata } from "next";
import { ownerPwaMetadata } from "@/lib/pwa/owner-manifest";

export const metadata: Metadata = {
  ...ownerPwaMetadata,
  title: "เข้าหน้าร้านของฉัน · ClipperQ",
  description: "เข้าสู่ระบบด้วย LINE เพื่อเปิดบอร์ดคิวร้านของคุณบน ClipperQ",
};

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
