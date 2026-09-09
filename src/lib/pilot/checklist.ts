export type PilotResultStatus = "pass" | "fail" | "pending";

export interface PilotCheckItem {
  id: string;
  label: string;
}

export interface PilotStep {
  id: string;
  title: string;
  instruction: string;
  items: PilotCheckItem[];
  resultRow?: string;
}

export interface PilotStepResult {
  status: PilotResultStatus;
  time: string;
  notes: string;
}

export interface PilotMetrics {
  ownerInviteToReady: string;
  firstBooking: string;
  returningBooking: string;
  shopCreatedAt: string | null;
}

export interface PilotState {
  checkedIds: string[];
  stepResults: Record<string, PilotStepResult>;
  metrics: PilotMetrics;
  goNoGo: PilotResultStatus;
}

export const PILOT_STORAGE_KEY = "barberq_pilot_checklist";

export const DEFAULT_PILOT_STATE: PilotState = {
  checkedIds: [],
  stepResults: {},
  metrics: {
    ownerInviteToReady: "",
    firstBooking: "",
    returningBooking: "",
    shopCreatedAt: null,
  },
  goNoGo: "pending",
};

export const PILOT_RESULT_ROWS = [
  "Owner claim",
  "Setup",
  "Add barber",
  "Hours",
  "LIFF open",
  "Booking",
  "Confirmation",
  "Board",
  "Cancel",
  "Conflict",
  "Shop isolation",
] as const;

export const PILOT_STEPS: PilotStep[] = [
  {
    id: "vercel",
    title: "1) เช็ก Vercel deploy",
    instruction: "ดู deployment ล่าสุดใน Vercel แล้วเปิด production URL จริง",
    items: [
      { id: "vercel-build", label: "Build success" },
      { id: "vercel-active", label: "Production deployment active" },
      { id: "vercel-env", label: "Environment Variables ครบใน Production scope" },
      { id: "vercel-no-error", label: "ไม่มี runtime error ตั้งแต่หน้าแรก" },
      { id: "vercel-home", label: "เปิด / ได้" },
      { id: "vercel-superadmin", label: "เปิด /superadmin ได้" },
      { id: "vercel-phinx", label: "เปิด /phinxstudio ได้" },
    ],
  },
  {
    id: "migration",
    title: "2) Apply migration 0017",
    instruction: "Apply ใน Supabase production ก่อนเทส flow ร้านใหม่",
    items: [
      { id: "mig-applied", label: "Migration 0017 apply แล้ว" },
      { id: "mig-hours", label: "มี shop hours" },
      { id: "mig-bookable", label: "มี is_bookable" },
      { id: "mig-unique", label: "per-shop barber name uniqueness" },
      { id: "mig-phinx", label: "PHINX backfill ถูกต้อง" },
    ],
  },
  {
    id: "phinx-smoke",
    title: "3) Smoke test PHINX",
    instruction: "ถ้าของเดิมพัง ให้หยุดก่อน",
    items: [
      { id: "phinx-load", label: "หน้าร้าน /phinxstudio โหลด" },
      { id: "phinx-barbers", label: "ช่างเดิมยังอยู่" },
      { id: "phinx-hours", label: "วันเวลาเปิดร้านเดิมถูก" },
      { id: "phinx-slots", label: "slot ขึ้นปกติ" },
      { id: "phinx-no-error", label: "ไม่มี error หลัง migration" },
      { id: "phinx-admin-login", label: "Owner login ผ่าน LINE" },
      { id: "phinx-board", label: "board โหลด" },
      { id: "phinx-settings", label: "settings โหลด" },
      { id: "phinx-team", label: "team โหลด" },
      { id: "phinx-schedule", label: "schedule โหลด" },
      { id: "phinx-stats", label: "stats โหลด" },
    ],
  },
  {
    id: "create-shop",
    title: "4) สร้างร้านใหม่จาก Super Admin",
    instruction: "สร้างร้าน BarberQ Pilot Test แล้วเริ่มจับเวลา",
    items: [
      { id: "shop-created", label: "shop ถูกสร้าง" },
      { id: "shop-pending", label: "status เป็น pending" },
      { id: "shop-slug", label: "slug ถูกสร้าง" },
      { id: "shop-invite", label: "invite URL ถูกสร้าง" },
      { id: "shop-no-collision", label: "ไม่ชนร้านอื่น" },
    ],
  },
  {
    id: "owner-claim",
    title: "5) Owner Claim บนมือถือจริง",
    instruction: "เปิด invite จาก LINE app — flow: invite → login → claim → /{slug}/admin/setup",
    resultRow: "Owner claim",
    items: [
      { id: "claim-no-token", label: "ไม่ต้องกรอก token" },
      { id: "claim-no-phinx", label: "ไม่หลุดไป PHINX" },
      { id: "claim-no-loop", label: "ไม่ redirect loop" },
      { id: "claim-in-line", label: "ไม่ต้องเปิด browser ภายนอก" },
      { id: "claim-setup", label: "เข้า setup wizard ได้" },
    ],
  },
  {
    id: "onboard-profile",
    title: "6a) Onboarding — Shop profile",
    instruction: "กรอกชื่อร้าน เบอร์ LINE contact แล้ว refresh 1 รอบ",
    resultRow: "Setup",
    items: [
      { id: "profile-save", label: "บันทึก profile สำเร็จ" },
      { id: "profile-persist", label: "refresh แล้วข้อมูลยังอยู่" },
    ],
  },
  {
    id: "onboard-team",
    title: "6b) Onboarding — Team",
    instruction: "Owner ไม่รับจอง, Barber A 30 นาที, Barber B 45 นาที",
    resultRow: "Add barber",
    items: [
      { id: "team-add", label: "เพิ่มช่างได้" },
      { id: "team-edit", label: "แก้ชื่อได้" },
      { id: "team-toggle", label: "toggle bookable ได้" },
      { id: "team-hidden", label: "ช่างที่ไม่ bookable ไม่ขึ้นหน้าลูกค้า" },
    ],
  },
  {
    id: "onboard-hours",
    title: "6c) Onboarding — Business hours",
    instruction: "จ–ศ 10:00–20:00, ส 11:00–18:00, อา ปิด",
    resultRow: "Hours",
    items: [
      { id: "hours-set", label: "ตั้งเวลาเปิดร้านได้" },
      { id: "hours-saved", label: "บันทึกแล้วถูกต้อง" },
    ],
  },
  {
    id: "onboard-schedule",
    title: "6d) Onboarding — Barber schedule",
    instruction: "Barber A หยุดพุธ, Barber B พัก 13:00–14:00",
    items: [
      { id: "sched-offday", label: "ตั้ง off-day ได้" },
      { id: "sched-break", label: "ตั้งพักกลางวันได้" },
      { id: "sched-no-db", label: "owner ทำได้โดยไม่แตะ DB" },
    ],
  },
  {
    id: "ready",
    title: "7) Ready state",
    instruction: "active + ≥1 bookable + ≥1 open day → ready (first booking ไม่ block)",
    items: [
      { id: "ready-active", label: "shop active" },
      { id: "ready-bookable", label: "≥1 bookable barber" },
      { id: "ready-hours", label: "≥1 open day" },
      { id: "ready-shown", label: "ขึ้นว่า ready" },
      { id: "ready-no-booking-block", label: "first booking ไม่ block ready" },
    ],
  },
  {
    id: "liff-link",
    title: "8) Copy LIFF booking link",
    instruction: "ต้องเป็น https://liff.line.me/{LIFF_ID}/{slug}",
    resultRow: "LIFF open",
    items: [
      { id: "liff-format", label: "ลิงก์เป็น liff.line.me/{LIFF_ID}/{slug}" },
      { id: "liff-not-vercel", label: "ไม่ใช่ Vercel URL ตรง" },
      { id: "liff-open-line", label: "paste ใน LINE chat แล้วเปิดได้" },
    ],
  },
  {
    id: "customer-login",
    title: "9) Customer LINE account ที่ 2",
    instruction: "อย่าใช้ Owner account",
    items: [
      { id: "cust-login", label: "LINE login ผ่าน" },
      { id: "cust-slug", label: "กลับร้านเดิมถูก slug" },
      { id: "cust-no-root", label: "ไม่เด้ง /" },
      { id: "cust-no-phinx", label: "ไม่เด้ง PHINX" },
      { id: "cust-no-loop", label: "ไม่มี login loop" },
    ],
  },
  {
    id: "booking",
    title: "10) ทดสอบ booking จริง",
    instruction: "เป้าหมาย first booking < 60 วินาที",
    resultRow: "Booking",
    items: [
      { id: "book-flow", label: "เลือกช่าง วัน เวลา ชื่อ เบอร์ confirm ได้" },
      { id: "book-time", label: "จองภายใน 60 วินาที" },
      { id: "book-no-error", label: "ไม่มี raw error" },
      { id: "book-single-barber", label: "ร้านช่างเดียว skip selector (ถ้ามี)" },
      { id: "book-closed-day", label: "วันร้านปิดเลือกไม่ได้" },
      { id: "book-offday", label: "ช่างหยุดไม่มี slot" },
      { id: "book-break", label: "ช่วงพักไม่มี slot" },
    ],
  },
  {
    id: "success-screen",
    title: "11) Success screen",
    instruction: "หลังจองต้องชัดว่าสำเร็จ",
    items: [
      { id: "succ-shop", label: "เห็นชื่อร้าน" },
      { id: "succ-barber", label: "เห็นช่าง" },
      { id: "succ-datetime", label: "เห็นวันเวลา" },
      { id: "succ-my-bookings", label: "มีดูคิวของฉัน" },
      { id: "succ-back", label: "มีกลับหน้าร้าน" },
      { id: "succ-add-friend-optional", label: "Add Friend BarberQ เป็น optional" },
    ],
  },
  {
    id: "line-confirm",
    title: "12) LINE confirmation",
    instruction: "push ไม่สำเร็จห้ามทำให้ booking หาย",
    resultRow: "Confirmation",
    items: [
      { id: "push-sent", label: "เพื่อน OA แล้วได้รับ push (ถ้ามี token)" },
      { id: "push-no-friend-ok", label: "ยังไม่ Add Friend — booking สำเร็จ" },
      { id: "push-no-disappear", label: "booking ไม่หายเมื่อ push ไม่สำเร็จ" },
      { id: "push-no-error", label: "ไม่ error เพราะ push ล้มเหลว" },
    ],
  },
  {
    id: "owner-board",
    title: "13) Owner Board",
    instruction: "กลับ Owner account ดูคิว",
    resultRow: "Board",
    items: [
      { id: "board-shows", label: "booking ขึ้นใน board" },
      { id: "board-name", label: "ชื่อถูก" },
      { id: "board-barber", label: "ช่างถูก" },
      { id: "board-time", label: "เวลาถูก" },
      { id: "board-shop", label: "ร้านถูก" },
      { id: "board-status", label: "status ถูก" },
    ],
  },
  {
    id: "my-bookings",
    title: "14) My Bookings",
    instruction: "Customer ดูคิวของฉัน — ห้ามหลุด PHINX",
    items: [
      { id: "my-only-mine", label: "เห็นเฉพาะ booking ของ customer คนนั้น" },
      { id: "my-same-shop", label: "อยู่ shop เดิม" },
      { id: "my-no-phinx", label: "ไม่หลุด PHINX" },
    ],
  },
  {
    id: "cancel",
    title: "15) Cancel",
    instruction: "ทดสอบ cancel ก่อน/หลัง cutoff",
    resultRow: "Cancel",
    items: [
      { id: "cancel-ok", label: "cancel >60 นาที สำเร็จ" },
      { id: "cancel-board", label: "board เปลี่ยนสถานะ" },
      { id: "cancel-slot", label: "slot กลับมา available" },
      { id: "cancel-blocked", label: "ใกล้ cutoff cancel ไม่ได้" },
      { id: "cancel-thai-msg", label: "ข้อความไทยเข้าใจง่าย" },
    ],
  },
  {
    id: "conflict",
    title: "16) Double Booking",
    instruction: "2 account เลือก slot เดียวกัน",
    resultRow: "Conflict",
    items: [
      { id: "conflict-one-wins", label: "คนหนึ่งสำเร็จ" },
      { id: "conflict-other", label: "อีกคนได้ conflict" },
      { id: "conflict-no-dup", label: "ไม่มี 2 booking ชนกัน" },
    ],
  },
  {
    id: "isolation",
    title: "17) Shop Isolation",
    instruction: "PHINX + Pilot Test Shop",
    resultRow: "Shop isolation",
    items: [
      { id: "iso-owner", label: "Owner Pilot เข้า PHINX admin ไม่ได้" },
      { id: "iso-barber", label: "Barber Pilot แตะ PHINX ไม่ได้" },
      { id: "iso-customer", label: "customer Pilot ไม่เห็น booking PHINX" },
      { id: "iso-settings", label: "settings ไม่ปนกัน" },
      { id: "iso-hours", label: "hours ไม่ปนกัน" },
      { id: "iso-staff", label: "staff ไม่ปนกัน" },
    ],
  },
  {
    id: "mobile",
    title: "18) มือถือจริง 3 แบบ",
    instruction: "LINE in-app, Safari/Chrome, ปิดแล้วเปิด link ใหม่",
    items: [
      { id: "mob-line", label: "LINE in-app browser ผ่าน" },
      { id: "mob-safari", label: "Safari/Chrome mobile ผ่าน" },
      { id: "mob-reopen", label: "ปิด LINE แล้วเปิด link ใหม่ผ่าน" },
      { id: "mob-no-loop", label: "ไม่มี redirect loop" },
      { id: "mob-state", label: "state ไม่หลุด" },
      { id: "mob-cta", label: "CTA ไม่โดน keyboard บัง" },
      { id: "mob-scroll", label: "ไม่มี horizontal scroll แปลก" },
    ],
  },
  {
    id: "metrics",
    title: "19) จับเวลา 3 ตัว",
    instruction: "Owner invite→Ready ≤15 นาที, First booking ≤60 วินาที, Returning ≤30 วินาที",
    items: [
      { id: "metric-owner", label: "Owner invite → Ready บันทึกแล้ว" },
      { id: "metric-first", label: "First customer booking บันทึกแล้ว" },
      { id: "metric-return", label: "Returning booking บันทึกแล้ว" },
    ],
  },
  {
    id: "go-nogo",
    title: "20) เกณฑ์ตัดสิน GO / NO-GO",
    instruction: "GO = setup เองได้, LIFF ผ่าน, จองได้, board เห็น, cancel ผ่าน, ไม่ชน, isolation ผ่าน",
    items: [
      { id: "go-owner", label: "Owner setup เองได้" },
      { id: "go-liff", label: "LIFF จริงผ่าน" },
      { id: "go-book", label: "customer จองได้" },
      { id: "go-board", label: "owner เห็นคิว" },
      { id: "go-cancel", label: "cancel ผ่าน" },
      { id: "go-conflict", label: "double booking ไม่เกิด" },
      { id: "go-isolation", label: "shop isolation ผ่าน" },
      { id: "go-no-blocker", label: "ไม่มี redirect blocker" },
      { id: "go-decision", label: "ตัดสิน GO หรือ NO-GO แล้ว" },
    ],
  },
];

export function parsePilotState(raw: string | null): PilotState {
  if (!raw) return DEFAULT_PILOT_STATE;
  try {
    const parsed = JSON.parse(raw) as Partial<PilotState>;
    return {
      checkedIds: Array.isArray(parsed.checkedIds) ? parsed.checkedIds : [],
      stepResults:
        parsed.stepResults && typeof parsed.stepResults === "object"
          ? parsed.stepResults
          : {},
      metrics: {
        ownerInviteToReady: parsed.metrics?.ownerInviteToReady ?? "",
        firstBooking: parsed.metrics?.firstBooking ?? "",
        returningBooking: parsed.metrics?.returningBooking ?? "",
        shopCreatedAt: parsed.metrics?.shopCreatedAt ?? null,
      },
      goNoGo: parsed.goNoGo === "pass" || parsed.goNoGo === "fail" ? parsed.goNoGo : "pending",
    };
  } catch {
    return DEFAULT_PILOT_STATE;
  }
}

export function isItemChecked(state: PilotState, itemId: string): boolean {
  return state.checkedIds.includes(itemId);
}

export function isStepComplete(step: PilotStep, state: PilotState): boolean {
  return step.items.every((item) => isItemChecked(state, item.id));
}

export function isStepUnlocked(stepIndex: number, state: PilotState): boolean {
  if (stepIndex === 0) return true;
  for (let i = 0; i < stepIndex; i++) {
    if (!isStepComplete(PILOT_STEPS[i], state)) return false;
  }
  return true;
}

export function getStepResultForRow(
  row: string,
  state: PilotState,
): PilotStepResult | undefined {
  const step = PILOT_STEPS.find((s) => s.resultRow === row);
  if (!step) return undefined;
  return state.stepResults[step.id];
}

export function buildResultsMarkdown(state: PilotState): string {
  const lines = [
    "| Step | Pass/Fail | เวลา | ปัญหา |",
    "| --- | --- | ---: | --- |",
  ];
  for (const row of PILOT_RESULT_ROWS) {
    const result = getStepResultForRow(row, state);
    const status = result?.status ?? "pending";
    const label = status === "pass" ? "Pass" : status === "fail" ? "Fail" : "-";
    lines.push(
      `| ${row} | ${label} | ${result?.time ?? ""} | ${result?.notes ?? ""} |`,
    );
  }
  lines.push("");
  lines.push(`GO/NO-GO: ${state.goNoGo === "pass" ? "GO" : state.goNoGo === "fail" ? "NO-GO" : "pending"}`);
  lines.push(`Owner invite → Ready: ${state.metrics.ownerInviteToReady || "-"}`);
  lines.push(`First booking: ${state.metrics.firstBooking || "-"}`);
  lines.push(`Returning booking: ${state.metrics.returningBooking || "-"}`);
  return lines.join("\n");
}
