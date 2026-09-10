import type { Metadata } from "next";
import { SalesPage } from "@/components/marketing/SalesPage";

export const metadata: Metadata = {
  title: "BarberQx | ระบบจองคิวร้านตัดผมผ่าน LINE",
  description:
    "ระบบจองคิวสำหรับร้านตัดผม ลูกค้าจองจาก LINE OA ของร้าน จัดการคิวและทีมช่างได้จากมือถือ",
};

export default function HomePage() {
  return <SalesPage />;
}
