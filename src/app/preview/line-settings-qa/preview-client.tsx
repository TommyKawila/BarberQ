"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const SUPPORT = "https://lin.ee/example";

function PreviewInner() {
  const params = useSearchParams();
  const state = params.get("state") ?? "h-after";

  if (state === "h-before") {
    return (
      <Shell title="เชื่อม LINE OA">
        <section className="rounded-2xl bg-zinc-900/80 p-4">
          <p className="text-sm font-semibold text-zinc-100">ติดตรงไหน? ให้ทีมช่วย</p>
          <p className="mt-1 text-xs text-zinc-400">วิดีโอคอลฟรี · เราไม่ขอรหัสผ่านของคุณ</p>
        </section>
      </Shell>
    );
  }

  if (state === "h-after") {
    return (
      <Shell title="เชื่อม LINE OA">
        <a
          href={SUPPORT}
          className="flex min-h-11 flex-col justify-center rounded-2xl bg-zinc-900/80 p-4"
          data-testid="line-settings-help-card"
        >
          <span className="text-sm font-semibold text-zinc-100">ติดตรงไหน? ให้ทีมช่วย</span>
          <span className="mt-1 text-xs text-zinc-400">วิดีโอคอลฟรี · เราไม่ขอรหัสผ่านของคุณ</span>
        </a>
      </Shell>
    );
  }

  if (state === "i-before") {
    return (
      <Shell title="คีย์ของ LINE OA" subtitle="ทดสอบไม่ผ่าน">
        <Check status="skip">Channel ID — ยังไม่ได้ตรวจ</Check>
        <Check status="fail">Channel Secret</Check>
        <Check status="fail">Access token</Check>
      </Shell>
    );
  }

  if (state === "i-after") {
    return (
      <Shell title="คีย์ของ LINE OA" subtitle="ทดสอบไม่ผ่าน">
        <Check status="fail">Channel ID — ยังไม่ได้กรอก</Check>
        <Check status="fail">Channel Secret</Check>
        <Check status="fail">Access token</Check>
      </Shell>
    );
  }

  if (state === "j-before") {
    return (
      <Shell title="เชื่อม LINE OA" subtitle="2 จาก 4 ขั้น">
        <p className="text-sm text-zinc-400">กำลังโหลด...</p>
        <Check status="pass">ขั้น 1</Check>
        <Check status="pass">ขั้น 2</Check>
        <Check status="pass">ขั้น 3</Check>
        <p className="min-h-11 text-sm font-medium text-amber-400">ติดต่อทีมทาง LINE</p>
      </Shell>
    );
  }

  return (
    <Shell title="เชื่อม LINE OA" subtitle="2 จาก 4 ขั้น · ใช้เวลาราว 15-40 นาที">
      <Check status="pass">ขั้น 1 — สร้าง LINE OA</Check>
      <Check status="pass">ขั้น 2 — วาง Webhook</Check>
      <Check status="pass">ขั้น 3 — Messaging API</Check>
      <Check status="skip">ขั้น 4 — เชิญทีมทางอีเมล</Check>
      <button type="button" className="min-h-11 text-left text-sm text-amber-400">
        ← กลับไปเช็คลิสต์
      </button>
      <a
        href={SUPPORT}
        className="mt-3 flex min-h-11 flex-col justify-center rounded-2xl bg-zinc-900/80 p-4"
      >
        <span className="text-sm font-semibold text-zinc-100">ติดตรงไหน? ให้ทีมช่วย</span>
        <span className="mt-1 text-xs text-zinc-400">วิดีโอคอลฟรี · เราไม่ขอรหัสผ่านของคุณ</span>
      </a>
    </Shell>
  );
}

function Shell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-[390px] bg-zinc-950 px-4 py-5 text-zinc-50">
      <h1 className="text-xl font-semibold">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-zinc-400">{subtitle}</p> : null}
      <div className="mt-4 flex flex-col gap-2">{children}</div>
    </main>
  );
}

function Check({
  status,
  children,
}: {
  status: "pass" | "fail" | "skip";
  children: React.ReactNode;
}) {
  const mark = status === "pass" ? "✓" : status === "fail" ? "✗" : "○";
  const color =
    status === "pass"
      ? "text-emerald-400"
      : status === "fail"
        ? "text-red-400"
        : "text-zinc-400";
  return (
    <p className={`border-b border-zinc-800 py-3 text-sm ${color}`}>
      {mark} {children}
    </p>
  );
}

export function LineSettingsQaPreview() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-zinc-400">กำลังโหลด…</p>}>
      <PreviewInner />
    </Suspense>
  );
}
