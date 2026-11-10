"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { resolveLineChecklistSteps } from "@/lib/line/line-checklist-steps";
import type { ShopLineChannelPublic } from "@/lib/line/shop-channel";

/** Local capture only — set NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL when taking h-after. */
const SUPPORT =
  process.env.NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL?.trim() || null;

const KEYLESS: ShopLineChannelPublic = {
  shopId: "preview",
  messagingChannelId: null,
  channelSecretLast4: null,
  accessTokenLast4: null,
  botUserId: null,
  botDisplayName: null,
  oaBasicId: null,
  plan: "free",
  monthlyPushBudget: 300,
  status: "broken",
  lastVerifiedAt: null,
  lastErrorCode: "MISSING_KEYS",
  lastErrorMessage: "lineConnect.error.missingAllKeys",
  checklistStep: 1,
  autoReplyConfirmedAt: null,
  hasSecret: false,
  hasAccessToken: false,
};

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
    if (!SUPPORT) {
      return (
        <Shell title="เชื่อม LINE OA">
          <p className="text-sm text-red-400" data-testid="help-missing-url">
            Set NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL to capture h-after
          </p>
        </Shell>
      );
    }
    return (
      <Shell title="เชื่อม LINE OA">
        <a
          href={SUPPORT}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 flex-col justify-center rounded-2xl bg-zinc-900/80 p-4 ring-1 ring-amber-400/40"
          data-testid="line-settings-help-card"
        >
          <span className="text-sm font-semibold text-amber-400 underline underline-offset-2">
            ติดตรงไหน? ให้ทีมช่วย
          </span>
          <span className="mt-1 text-xs text-zinc-400">
            วิดีโอคอลฟรี · เราไม่ขอรหัสผ่านของคุณ
          </span>
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
      <Shell title="เชื่อม LINE OA" subtitle="กำลังโหลด...">
        <p className="text-sm text-zinc-400">กำลังโหลด...</p>
      </Shell>
    );
  }

  // j-after: keyless after failed key test — Messaging API must NOT be ticked
  const { currentStep, steps } = resolveLineChecklistSteps(KEYLESS);
  return (
    <Shell
      title="เชื่อม LINE OA"
      subtitle={`${currentStep} จาก 4 ขั้น · ใช้เวลาราว 15-40 นาที`}
    >
      <WizardStep
        n={1}
        done={steps[0].done}
        active={steps[0].active}
        title="เปิดใช้ Messaging API"
      />
      <WizardStep
        n={2}
        done={steps[1].done}
        active={steps[1].active}
        title="วาง Webhook URL"
      />
      <WizardStep
        n={3}
        done={steps[2].done}
        active={steps[2].active}
        title="ปิดข้อความตอบกลับอัตโนมัติ"
      />
      <WizardStep
        n={4}
        done={steps[3].done}
        active={steps[3].active}
        title="เชิญ ClipperQ เป็น Admin"
      />
      <button type="button" className="mt-2 min-h-11 text-left text-sm text-amber-400">
        ← กลับไปเช็คลิสต์
      </button>
      {SUPPORT ? (
        <a
          href={SUPPORT}
          className="mt-3 flex min-h-11 flex-col justify-center rounded-2xl bg-zinc-900/80 p-4 ring-1 ring-amber-400/40"
        >
          <span className="text-sm font-semibold text-amber-400 underline underline-offset-2">
            ติดตรงไหน? ให้ทีมช่วย
          </span>
          <span className="mt-1 text-xs text-zinc-400">
            วิดีโอคอลฟรี · เราไม่ขอรหัสผ่านของคุณ
          </span>
        </a>
      ) : null}
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

function WizardStep({
  n,
  title,
  done,
  active,
}: {
  n: number;
  title: string;
  done: boolean;
  active: boolean;
}) {
  return (
    <div className="flex gap-3 border-b border-zinc-800 py-3">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          done
            ? "bg-emerald-500 text-white"
            : active
              ? "bg-amber-400 text-zinc-950"
              : "bg-zinc-700 text-zinc-200"
        }`}
      >
        {done ? "✓" : n}
      </div>
      <p className="text-sm font-semibold text-zinc-100">{title}</p>
    </div>
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
