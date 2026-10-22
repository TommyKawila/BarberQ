import type { Metadata } from "next";
import { SalesPage } from "@/components/marketing/SalesPage";

export const metadata: Metadata = {
  title: "ClipperQ | ระบบจองคิวร้านตัดผมผ่าน LINE",
  description:
    "ระบบจองคิวสำหรับร้านตัดผม ลูกค้าจองจาก LINE OA ของร้าน จัดการคิวและทีมช่างได้จากมือถือ",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ heroScene?: string }>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const raw = sp?.heroScene != null ? Number(sp.heroScene) : NaN;
  const heroScene =
    Number.isFinite(raw) && raw >= 0 && raw <= 3 ? Math.floor(raw) : undefined;
  return <SalesPage heroScene={heroScene} />;
}
