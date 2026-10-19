/**
 * Visual replica of LINE Flex Option A · Warm Note (src/lib/line/flex-messages.ts).
 * Tokens, Thai copy, and layout match the real builders — not inventing promo copy.
 */

export const WARM_NOTE = {
  ink: "#1C1917",
  ink2: "#57534E",
  muted: "#78716C",
  line: "#E7E5E4",
  confirm: {
    tint: "#ECFDF3",
    accent: "#15803D",
    accentText: "#166534",
    status: "✓ จองคิวเรียบร้อยแล้ว",
    note: "ขอบคุณที่ให้เราดูแลนะครับ แล้วเจอกันที่ร้าน",
  },
  reminder: {
    tint: "#FFF4E0",
    accent: "#B45309",
    accentText: "#92400E",
    status: "ใกล้ถึงคิวของคุณแล้ว",
    note: "ร้านรอต้อนรับนะครับ เดินทางปลอดภัยครับ",
  },
} as const;

/** Sample booking used by flex-messages tests / render-option-a-flex.mjs */
export const WARM_NOTE_SAMPLE = {
  shopName: "ClipperQ Demo",
  barberName: "นัท · Nat",
  /** Asia/Bangkok · Sun 18 Oct 2026 */
  date: "อา. 18 ต.ค.",
  time: "18:30–19:30",
  /** bookingShortCode("a12f3b00-0000-4000-8000-000000000001") */
  bookingCode: "#A12F3B",
  primaryCta: "ดูคิวของฉัน",
  linkCta: "เลื่อน / ยกเลิกนัด",
} as const;

export type WarmNoteVariant = "confirm" | "reminder";

export function WarmNoteFlexCard({
  variant,
  shopName = WARM_NOTE_SAMPLE.shopName,
  className,
}: {
  variant: WarmNoteVariant;
  shopName?: string;
  className?: string;
}) {
  const theme = variant === "confirm" ? WARM_NOTE.confirm : WARM_NOTE.reminder;

  return (
    <div
      className={`overflow-hidden rounded-[10px] bg-white shadow-sm ${className ?? ""}`}
      style={{ color: WARM_NOTE.ink }}
    >
      {/* Header — shop name prominent + status on tint */}
      <div
        className="px-[11%] pb-[8%] pt-[10%]"
        style={{ backgroundColor: theme.tint }}
      >
        <p
          className="text-[11px] font-bold leading-snug"
          style={{ color: WARM_NOTE.ink }}
        >
          {shopName}
        </p>
        <p
          className="mt-0.5 text-[9px] font-bold leading-snug"
          style={{ color: theme.accentText }}
        >
          {theme.status}
        </p>
      </div>

      {/* Body — big date/time, separator, rows, note */}
      <div className="px-[11%] pb-[6%] pt-[8%]">
        <p
          className="text-[10px] font-bold leading-snug"
          style={{ color: WARM_NOTE.ink2 }}
        >
          {WARM_NOTE_SAMPLE.date}
        </p>
        <p
          className="text-[15px] font-bold leading-tight tracking-tight"
          style={{ color: WARM_NOTE.ink }}
        >
          {WARM_NOTE_SAMPLE.time}
        </p>
        <div
          className="mt-[10%] border-t"
          style={{ borderColor: WARM_NOTE.line }}
        />
        <div className="mt-[10%] flex gap-2 text-[9px] leading-snug">
          <span className="w-[28%] shrink-0" style={{ color: WARM_NOTE.muted }}>
            ช่าง
          </span>
          <span className="min-w-0 flex-1 font-bold" style={{ color: WARM_NOTE.ink }}>
            {WARM_NOTE_SAMPLE.barberName}
          </span>
        </div>
        {variant === "confirm" ? (
          <div className="mt-[6%] flex gap-2 text-[9px] leading-snug">
            <span className="w-[28%] shrink-0" style={{ color: WARM_NOTE.muted }}>
              เลขที่จอง
            </span>
            <span className="min-w-0 flex-1 font-bold" style={{ color: WARM_NOTE.ink }}>
              {WARM_NOTE_SAMPLE.bookingCode}
            </span>
          </div>
        ) : null}
        <p
          className="mt-[10%] text-[8.5px] leading-snug"
          style={{ color: WARM_NOTE.ink2 }}
        >
          {theme.note}
        </p>
      </div>

      {/* Footer — primary + link (same labels as real builders) */}
      <div className="px-[11%] pb-[8%]">
        <div
          className="rounded-md py-[7%] text-center text-[9.5px] font-bold text-white"
          style={{ backgroundColor: theme.accent }}
        >
          {WARM_NOTE_SAMPLE.primaryCta}
        </div>
        <p
          className="mt-[5%] py-[2%] text-center text-[8.5px]"
          style={{ color: WARM_NOTE.ink2 }}
        >
          {WARM_NOTE_SAMPLE.linkCta}
        </p>
      </div>
    </div>
  );
}
