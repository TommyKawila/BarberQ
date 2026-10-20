import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { CLIPPERQ_OA_LINE_URL } from "@/lib/marketing/clipperq-oa";
import { DEFAULT_DEMO_SHOP_SLUG } from "@/lib/marketing/demo-shop";

export function DemoUnavailable({
  variant = "booking",
}: {
  variant?: "booking" | "board";
}) {
  const title =
    variant === "board" ? "บอร์ดตัวอย่างยังไม่พร้อม" : "ร้านตัวอย่างยังไม่พร้อม";

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-950 text-zinc-50">
      <MarketingNav variant="trial" />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-12">
        <p className="text-sm font-medium text-[#F6AD34]">ClipperQ Demo</p>
        <h1 className="mt-2 text-2xl font-bold">{title}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-zinc-400">
          เรากำลังเตรียมร้านตัวอย่าง{" "}
          <code className="text-[#F6AD34]">{DEFAULT_DEMO_SHOP_SLUG}</code>{" "}
          ให้ลองจองและดูบอร์ดได้โดยไม่กระทบร้านจริง (PHINX / testshop / pilot)
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/trial"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#F6AD34] px-6 py-3 font-semibold text-[#111111]"
          >
            ทดลองใช้ฟรี 30 วัน
          </Link>
          <a
            href={CLIPPERQ_OA_LINE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#F6AD34]/60 px-6 py-3 font-semibold text-[#F6AD34]"
          >
            สมัครผ่าน LINE
          </a>
          <Link
            href="/guide"
            className="inline-flex min-h-11 items-center justify-center text-sm text-zinc-400 underline underline-offset-4"
          >
            ดูคู่มือ & FAQ
          </Link>
        </div>
      </main>
      <MarketingFooter variant="trial" />
    </div>
  );
}
