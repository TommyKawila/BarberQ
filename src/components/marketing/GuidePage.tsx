"use client";

import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import {
  demoShopBookingPath,
  demoShopBookingsPath,
  getDemoShopSlug,
} from "@/lib/marketing/demo-shop";
import { CLIPPERQ_OA_LINE_URL } from "@/lib/marketing/clipperq-oa";
import { buildShopCustomerUrl } from "@/lib/line/liff-url";

const APP_BASE =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "")
    : "";

function abs(path: string): string {
  return APP_BASE ? `${APP_BASE}${path}` : path;
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-xl font-bold text-zinc-50">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-zinc-300">
        {children}
      </div>
    </section>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 break-all font-mono text-sm text-[#F6AD34]">{value}</p>
    </div>
  );
}

export function GuidePage() {
  const slug = getDemoShopSlug();
  const bookPath = demoShopBookingPath();
  const myQueuePath = demoShopBookingsPath();
  const bookUrl = buildShopCustomerUrl(slug) || abs(bookPath);
  const myQueueUrl = buildShopCustomerUrl(slug, "/bookings") || abs(myQueuePath);

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-950 text-zinc-50">
      <MarketingNav variant="trial" />
      <article className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 md:px-6 md:py-14">
        <header>
          <p className="text-sm font-medium text-[#F6AD34]">คู่มือ & FAQ</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight">
            เริ่มใช้ ClipperQ สำหรับเจ้าของร้าน
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-400">
            เชื่อม LINE OA ร้าน เชิญช่าง รับ walk-in ปิดคิว — และตั้ง Rich Menu ของร้านเอง
          </p>
        </header>

        <nav className="mt-6 flex flex-wrap gap-2 text-xs">
          {[
            ["#connect-oa", "เชื่อม LINE OA"],
            ["#invite-barbers", "เชิญช่าง"],
            ["#walk-in", "Walk-in / บล็อก"],
            ["#close-queue", "ปิดคิว"],
            ["#shop-rich-menu", "Rich Menu ร้าน"],
            ["#faq", "FAQ"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="inline-flex min-h-11 items-center rounded-lg border border-zinc-700 px-3 py-2 text-zinc-300 hover:border-[#F6AD34]/50"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="mt-10 space-y-10">
          <Section id="connect-oa" title="1) เชื่อม LINE OA ของร้าน">
            <p>
              ลูกค้าจองจาก <strong className="text-zinc-100">LINE OA ของร้านคุณ</strong>{" "}
              ไม่ใช่ OA ของ ClipperQ
            </p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>เปิดหน้า Admin ของร้าน → ตั้งค่า / ตั้งร้าน</li>
              <li>ทำตามขั้นตอนเชื่อม Channel ของ LINE OA ร้าน</li>
              <li>คัดลอกลิงก์จองของร้าน ไปวางใน Rich Menu หรือปุ่มในแชท</li>
            </ol>
            <p className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-zinc-500">
              <span>ยังไม่มีร้าน?</span>
              <Link
                href="/trial"
                className="inline-flex min-h-11 items-center text-[#F6AD34] underline underline-offset-2"
              >
                ทดลองใช้ฟรี 30 วัน
              </Link>
              <span>หรือ</span>
              <a
                href={CLIPPERQ_OA_LINE_URL}
                className="inline-flex min-h-11 items-center text-[#F6AD34] underline underline-offset-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                สมัครผ่าน LINE
              </a>
            </p>
          </Section>

          <Section id="invite-barbers" title="2) ผูก LINE ของช่าง (ลิงก์เชิญ / QR)">
            <ol className="list-decimal space-y-2 pl-5">
              <li>ใน Admin เปิดหน้าทีมงาน / จัดการช่าง</li>
              <li>เพิ่มช่าง แล้วส่งลิงก์เชิญหรือให้สแกน QR</li>
              <li>ช่างกดลิงก์ → เข้าสู่ระบบด้วย LINE ของตัวเอง → ผูกกับร้าน</li>
            </ol>
            <p>
              ช่างที่ผูกแล้วจะเห็นคอลัมน์ตัวเองบนบอร์ด และรับการแจ้งเตือนตามที่ร้านเปิดไว้
            </p>
          </Section>

          <Section id="walk-in" title="3) Walk-in และบล็อกเวลา">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-zinc-100">บล็อกเวลา:</strong> กดช่องว่างบนบอร์ดเพื่อกันช่วงพัก
                หรือจองด้วยมือ
              </li>
              <li>
                <strong className="text-zinc-100">Walk-in:</strong> รับคิวหน้าร้านผ่าน QR หรือกดรับบนบอร์ด
                — คิวเข้าบอร์ดชุดเดียวกับจองออนไลน์
              </li>
            </ul>
          </Section>

          <Section id="close-queue" title="4) ปิดคิว — บริการและราคา">
            <ol className="list-decimal space-y-2 pl-5">
              <li>เมื่อตัดเสร็จ กดปิดคิว / เสร็จ บนบอร์ด</li>
              <li>เลือกบริการ (และราคาถ้าตั้งไว้) เพื่อสรุปยอด</li>
              <li>สถานะจะอัปเดตในสรุปคิวของร้าน</li>
            </ol>
          </Section>

          <Section id="shop-rich-menu" title="Rich Menu สำหรับร้าน">
            <p>
              ร้านตั้ง Rich Menu เองใน{" "}
              <strong className="text-zinc-100">LINE Official Account Manager</strong>{" "}
              ของ OA ร้าน — ClipperQ ไม่บังคับเทมเพลต แต่แนะนำปุ่มอย่างน้อยสองปุ่ม:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-zinc-100">จองคิว</strong> → ลิงก์จองของร้าน{" "}
                <code className="text-[#F6AD34]">/{`{slug}`}</code>
              </li>
              <li>
                <strong className="text-zinc-100">คิวของฉัน</strong> →{" "}
                <code className="text-[#F6AD34]">/{`{slug}`}/bookings</code>
              </li>
            </ul>

            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-zinc-200">
                ลิงก์สำหรับปุ่ม Rich Menu (ตัวอย่างร้าน Demo · slug{" "}
                <code className="text-[#F6AD34]">{slug}</code>)
              </p>
              <p className="text-xs text-zinc-500">
                ร้านจริง: แทน slug ด้วย slug ของคุณ — หรือดูในหน้า Admin หลังเข้าสู่ระบบ
                (การ์ดลิงก์ใน settings จะตามมาในรอบ redesign admin · PR #21)
              </p>
              <CopyField label="จองคิว (LIFF ถ้าตั้งค่าแล้ว)" value={bookUrl} />
              <CopyField label="คิวของฉัน (LIFF ถ้าตั้งค่าแล้ว)" value={myQueueUrl} />
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium text-zinc-200">
                เทมเพลต PNG (ทางเลือก) — อัปโหลดใน LINE OA Manager
              </p>
              <ul className="mt-3 space-y-1">
                <li className="flex flex-wrap items-center gap-x-1">
                  <a
                    href="/rich-menu/shop-large.png"
                    download
                    className="inline-flex min-h-11 items-center text-[#F6AD34] underline underline-offset-2"
                  >
                    ดาวน์โหลด shop-large.png
                  </a>
                  <span className="text-zinc-500"> · Large 2500×1686</span>
                </li>
                <li className="flex flex-wrap items-center gap-x-1">
                  <a
                    href="/rich-menu/shop-compact.png"
                    download
                    className="inline-flex min-h-11 items-center text-[#F6AD34] underline underline-offset-2"
                  >
                    ดาวน์โหลด shop-compact.png
                  </a>
                  <span className="text-zinc-500"> · Compact 2500×843</span>
                </li>
                <li className="flex flex-wrap items-center gap-x-1">
                  <a
                    href="/rich-menu/variants/shop-large-nologo.png"
                    download
                    className="inline-flex min-h-11 items-center text-[#F6AD34] underline underline-offset-2"
                  >
                    shop-large-nologo.png
                  </a>
                  <span className="text-zinc-500"> · ไม่มีโลโก้ (ตัวอักษรแรก)</span>
                </li>
                <li>
                  <a
                    href="/rich-menu/variants/shop-compact-nologo.png"
                    download
                    className="inline-flex min-h-11 items-center text-[#F6AD34] underline underline-offset-2"
                  >
                    shop-compact-nologo.png
                  </a>
                </li>
                <li className="flex flex-wrap items-center gap-x-1">
                  <a
                    href="/rich-menu/variants/shop-large-longname.png"
                    download
                    className="inline-flex min-h-11 items-center text-[#F6AD34] underline underline-offset-2"
                  >
                    shop-large-longname.png
                  </a>
                  <span className="text-zinc-500"> · ชื่อร้านยาว</span>
                </li>
                <li>
                  <a
                    href="/rich-menu/variants/shop-compact-longname.png"
                    download
                    className="inline-flex min-h-11 items-center text-[#F6AD34] underline underline-offset-2"
                  >
                    shop-compact-longname.png
                  </a>
                </li>
              </ul>
              <p className="mt-2 text-xs text-zinc-500">
                กริดมาตรฐาน LINE: คอลัมน์ 833/834/833 · แถว 843 — พิกัดและ JSON ใน{" "}
                <code className="text-zinc-400">docs/line-rich-menu.md</code>
              </p>
            </div>
          </Section>

          <Section id="faq" title="FAQ สั้น ๆ">
            <dl className="space-y-4">
              <div>
                <dt className="font-semibold text-zinc-100">ทดลองใช้ต้องผูกบัตรไหม?</dt>
                <dd className="mt-1 text-zinc-400">
                  ไม่ต้อง — ฟรี 30 วัน ยกเลิกได้ทุกเมื่อ{" "}
                  <Link href="/trial" className="text-[#F6AD34] underline">
                    เปิดหน้าทดลองใช้
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-zinc-100">อยากดูตัวอย่างระบบ?</dt>
                <dd className="mt-1 text-zinc-400">
                  เปิดร้าน Demo ได้ที่{" "}
                  <Link href="/demo" className="text-[#F6AD34] underline">
                    /demo
                  </Link>{" "}
                  · บอร์ดอ่านอย่างเดียว{" "}
                  <Link href="/demo/board" className="text-[#F6AD34] underline">
                    /demo/board
                  </Link>{" "}
                  (slug <code className="text-[#F6AD34]">clipperqdemo</code>)
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-zinc-100">ราคาเท่าไหร่?</dt>
                <dd className="mt-1 text-zinc-400">
                  ตามจำนวนช่าง — ดูที่{" "}
                  <Link href="/#pricing" className="text-[#F6AD34] underline">
                    หน้าราคา
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-zinc-100">เข้าหน้าร้านของฉันจากไหน?</dt>
                <dd className="mt-1 text-zinc-400">
                  จากเมนู LINE OA ClipperQ กด「เข้าหน้าร้านของฉัน」 หรือเปิด{" "}
                  <Link href="/owner" className="text-[#F6AD34] underline">
                    /owner
                  </Link>{" "}
                  — ล็อกอิน LINE แล้วไปบอร์ดร้าน (หลายร้านให้เลือก; ไม่มีร้านจะพาไป /trial)
                </dd>
              </div>
            </dl>
          </Section>
        </div>
      </article>
      <MarketingFooter variant="trial" />
    </div>
  );
}
