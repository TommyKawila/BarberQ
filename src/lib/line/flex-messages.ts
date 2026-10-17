import { formatInTimeZone } from "date-fns-tz";
import { th } from "date-fns/locale";
import { canCancelAt, SHOP_TIMEZONE } from "@/lib/services/slot-service";
import { bookingShortCode } from "@/lib/line/booking-code";

/** Option A · Warm Note tokens. */
const INK = "#1C1917";
const INK_2 = "#57534E";
const MUTED = "#78716C";
const LINE = "#E7E5E4";
const CONFIRM = {
  tint: "#ECFDF3",
  accent: "#15803D",
  accentText: "#166534",
} as const;
const REMINDER = {
  tint: "#FFF4E0",
  accent: "#B45309",
  accentText: "#92400E",
} as const;
/** Queue ticket — neutral warm stone. */
const STONE = {
  tint: "#F5F5F4",
  accent: "#44403C",
  accentText: "#44403C",
} as const;
/** Shop cancelled the booking — rose. */
const CANCELLED = {
  tint: "#FEF2F2",
  accent: "#B91C1C",
  accentText: "#991B1B",
} as const;
/** Shop asks to move the booking — amber (same family as reminder). */
const SHOP_MOVE = {
  tint: "#FFF7ED",
  accent: "#C2410C",
  accentText: "#9A3412",
} as const;

function whenLabel(iso: string): string {
  return formatInTimeZone(new Date(iso), SHOP_TIMEZONE, "EEE d MMM", { locale: th });
}

function timeRange(startIso: string, endIso: string): string {
  const start = formatInTimeZone(new Date(startIso), SHOP_TIMEZONE, "HH:mm");
  const end = formatInTimeZone(new Date(endIso), SHOP_TIMEZONE, "HH:mm");
  return `${start}–${end}`;
}

function detailRow(
  label: string,
  value: string,
  margin: "lg" | "md",
  opts?: { struck?: boolean },
) {
  const struck = Boolean(opts?.struck);
  return {
    type: "box",
    layout: "baseline",
    spacing: "md",
    margin,
    contents: [
      { type: "text", text: label, size: "sm", color: MUTED, flex: 2 },
      {
        type: "text",
        text: value,
        size: "md",
        color: struck ? MUTED : INK,
        weight: struck ? "regular" : "bold",
        flex: 5,
        wrap: true,
        ...(struck ? { decoration: "line-through" } : {}),
      },
    ],
  };
}

function warmNoteHeader(shopName: string, status: string, accentText: string, tint: string) {
  return {
    type: "box",
    layout: "vertical",
    backgroundColor: tint,
    paddingAll: "20px",
    paddingBottom: "16px",
    contents: [
      {
        type: "text",
        text: shopName,
        size: "lg",
        color: INK,
        weight: "bold",
        wrap: true,
        maxLines: 2,
      },
      {
        type: "text",
        text: status,
        size: "sm",
        color: accentText,
        weight: "bold",
        margin: "xs",
        wrap: true,
      },
    ],
  };
}

function warmNoteFooter(opts: {
  accent: string;
  primaryLabel: string;
  primaryUrl: string;
  linkLabel?: string;
  linkUrl?: string | null;
  extraLinks?: Array<{ label: string; uri: string }>;
}) {
  const contents: unknown[] = [
    {
      type: "button",
      style: "primary",
      color: opts.accent,
      height: "md",
      action: {
        type: "uri",
        label: opts.primaryLabel,
        uri: opts.primaryUrl,
      },
    },
  ];
  if (opts.linkUrl && opts.linkLabel) {
    contents.push({
      type: "button",
      style: "link",
      color: INK_2,
      height: "sm",
      action: {
        type: "uri",
        label: opts.linkLabel,
        uri: opts.linkUrl,
      },
    });
  }
  for (const link of opts.extraLinks ?? []) {
    contents.push({
      type: "button",
      style: "link",
      color: INK_2,
      height: "sm",
      action: { type: "uri", label: link.label, uri: link.uri },
    });
  }
  return {
    type: "box",
    layout: "vertical",
    spacing: "sm",
    paddingTop: "0px",
    paddingBottom: "12px",
    paddingStart: "20px",
    paddingEnd: "20px",
    contents,
  };
}

/** Option A · Warm Note — booking confirmation (green). */
export function buildBookingConfirmFlex(input: {
  shopName: string;
  startTime: string;
  endTime: string;
  barberName: string;
  appointmentId: string;
  myBookingsUrl: string;
  cancelUrl: string;
}) {
  const code = bookingShortCode(input.appointmentId);
  const date = whenLabel(input.startTime);
  const time = timeRange(input.startTime, input.endTime);
  return {
    type: "flex",
    altText: `✓ จองคิวแล้ว ${date} ${time} กับช่าง ${input.barberName}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: warmNoteHeader(
        input.shopName,
        "✓ จองคิวเรียบร้อยแล้ว",
        CONFIRM.accentText,
        CONFIRM.tint,
      ),
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        paddingTop: "16px",
        contents: [
          {
            type: "text",
            text: date,
            size: "md",
            color: INK_2,
            weight: "bold",
          },
          {
            type: "text",
            text: time,
            size: "xxl",
            color: INK,
            weight: "bold",
          },
          { type: "separator", margin: "lg", color: LINE },
          detailRow("ช่าง", input.barberName, "lg"),
          detailRow("เลขที่จอง", `#${code}`, "md"),
          {
            type: "text",
            text: "ขอบคุณที่ให้เราดูแลนะครับ แล้วเจอกันที่ร้าน",
            size: "sm",
            color: INK_2,
            wrap: true,
            margin: "lg",
          },
        ],
      },
      footer: warmNoteFooter({
        accent: CONFIRM.accent,
        primaryLabel: "ดูคิวของฉัน",
        primaryUrl: input.myBookingsUrl,
        linkLabel: "เลื่อน / ยกเลิกนัด",
        linkUrl: input.cancelUrl,
      }),
    },
  };
}

/** Option A · Warm Note — queue ticket (stone). Sent with booking confirm pair. */
export function buildQueueTicketFlex(input: {
  shopName: string;
  queueLabel: string;
  aheadCount: number;
  waitMinutes: number;
  liveUrl: string;
}) {
  const waitLine = `ก่อนหน้า ${input.aheadCount} คิว · รอประมาณ ${input.waitMinutes} นาที`;
  return {
    type: "flex",
    altText: `บัตรคิว ${input.queueLabel} · ${waitLine}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: warmNoteHeader(
        input.shopName,
        "บัตรคิวของคุณ",
        STONE.accentText,
        STONE.tint,
      ),
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        paddingTop: "16px",
        contents: [
          {
            type: "text",
            text: "คิวของคุณ",
            size: "sm",
            color: MUTED,
          },
          {
            type: "text",
            text: input.queueLabel,
            size: "xxl",
            weight: "bold",
            color: INK,
            margin: "xs",
          },
          { type: "separator", margin: "lg", color: LINE },
          {
            type: "text",
            text: waitLine,
            size: "sm",
            color: INK_2,
            wrap: true,
            margin: "lg",
          },
        ],
      },
      footer: warmNoteFooter({
        accent: STONE.accent,
        primaryLabel: "ดูสถานะสด",
        primaryUrl: input.liveUrl,
      }),
    },
  };
}

/** Option A · Warm Note — shop cancelled the customer's booking (rose). */
export function buildShopCancelFlex(input: {
  shopName: string;
  startTime: string;
  barberName: string;
  reason?: string | null;
  bookUrl: string;
  callUrl?: string | null;
}) {
  const date = whenLabel(input.startTime);
  const time = formatInTimeZone(new Date(input.startTime), SHOP_TIMEZONE, "HH:mm");
  const bodyContents: unknown[] = [
    {
      type: "text",
      text: date,
      size: "md",
      color: INK_2,
      weight: "bold",
    },
    {
      type: "text",
      text: time,
      size: "xxl",
      color: INK,
      weight: "bold",
    },
    { type: "separator", margin: "lg", color: LINE },
    detailRow("ช่าง", input.barberName, "lg"),
  ];
  if (input.reason) bodyContents.push(detailRow("เหตุผล", input.reason, "md"));
  bodyContents.push({
    type: "text",
    text: "ขออภัยในความไม่สะดวกนะครับ จองเวลาใหม่ได้เลย",
    size: "sm",
    color: INK_2,
    wrap: true,
    margin: "lg",
  });

  return {
    type: "flex",
    altText: `ร้านยกเลิกนัด ${date} ${time} กับช่าง ${input.barberName}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: warmNoteHeader(
        input.shopName,
        "ร้านยกเลิกนัดของคุณ",
        CANCELLED.accentText,
        CANCELLED.tint,
      ),
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        paddingTop: "16px",
        contents: bodyContents,
      },
      footer: warmNoteFooter({
        accent: CANCELLED.accent,
        primaryLabel: "จองเวลาใหม่",
        primaryUrl: input.bookUrl,
        linkLabel: input.callUrl ? "โทรหาร้าน" : undefined,
        linkUrl: input.callUrl ?? null,
      }),
    },
  };
}

/**
 * Option A shell for shop-initiated reschedule (multi-action footer kept:
 * one primary + two links — not the single-link Warm Note pattern).
 */
export function buildShopRescheduleFlex(input: {
  shopName: string;
  oldStartTime: string;
  newStartTime: string;
  barberName: string;
  reason?: string | null;
  acceptUrl: string;
  pickUrl: string;
  cancelUrl: string;
}) {
  const newDate = whenLabel(input.newStartTime);
  const newTime = formatInTimeZone(new Date(input.newStartTime), SHOP_TIMEZONE, "HH:mm");
  const oldLabel = `${whenLabel(input.oldStartTime)} ${formatInTimeZone(new Date(input.oldStartTime), SHOP_TIMEZONE, "HH:mm")}`;
  const bodyContents: unknown[] = [
    {
      type: "text",
      text: newDate,
      size: "md",
      color: INK_2,
      weight: "bold",
    },
    {
      type: "text",
      text: newTime,
      size: "xxl",
      color: INK,
      weight: "bold",
    },
    { type: "separator", margin: "lg", color: LINE },
    detailRow("ช่าง", input.barberName, "lg"),
    detailRow("เดิม", oldLabel, "md", { struck: true }),
  ];
  if (input.reason) bodyContents.push(detailRow("เหตุผล", input.reason, "md"));
  bodyContents.push({
    type: "text",
    text: "ร้านขอเลื่อนนัดให้นะครับ เลือกรับเวลาใหม่หรือเลือกเองได้",
    size: "sm",
    color: INK_2,
    wrap: true,
    margin: "lg",
  });

  return {
    type: "flex",
    altText: `ร้านขอเลื่อนนัด ${newDate} ${newTime} กับช่าง ${input.barberName}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: warmNoteHeader(
        input.shopName,
        "ร้านขอเลื่อนนัดของคุณ",
        SHOP_MOVE.accentText,
        SHOP_MOVE.tint,
      ),
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        paddingTop: "16px",
        contents: bodyContents,
      },
      footer: warmNoteFooter({
        accent: SHOP_MOVE.accent,
        // Matches My Bookings destination (LIFF /bookings); card is TH-only.
        primaryLabel: "ดูคิวของฉัน",
        primaryUrl: input.acceptUrl,
        linkLabel: "เลือกเวลาอื่น",
        linkUrl: input.pickUrl,
        extraLinks: [{ label: "ยกเลิกนัด", uri: input.cancelUrl }],
      }),
    },
  };
}

/**
 * Option A · Warm Note — appointment reminder (amber).
 * Link `เลื่อน / ยกเลิกนัด` only when cancelUrl is set AND start − now ≥ 60 min
 * (same TOO_LATE / canCancelAt rule). Pass `now` in tests.
 */
export function buildAppointmentReminderFlex(input: {
  shopName: string;
  startTime: string;
  endTime: string;
  barberName: string;
  myBookingsUrl: string;
  cancelUrl?: string | null;
  /** Override clock for cancel-link visibility (tests). */
  now?: Date;
}) {
  const date = whenLabel(input.startTime);
  const time = timeRange(input.startTime, input.endTime);
  const showCancelLink =
    Boolean(input.cancelUrl?.trim()) &&
    canCancelAt(input.startTime, input.now ?? new Date());

  return {
    type: "flex",
    altText: `ใกล้ถึงคิวแล้ว ${date} ${time} กับช่าง ${input.barberName}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: warmNoteHeader(
        input.shopName,
        "ใกล้ถึงคิวของคุณแล้ว",
        REMINDER.accentText,
        REMINDER.tint,
      ),
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        paddingTop: "16px",
        contents: [
          {
            type: "text",
            text: date,
            size: "md",
            color: INK_2,
            weight: "bold",
          },
          {
            type: "text",
            text: time,
            size: "xxl",
            color: INK,
            weight: "bold",
          },
          { type: "separator", margin: "lg", color: LINE },
          detailRow("ช่าง", input.barberName, "lg"),
          {
            type: "text",
            text: "ร้านรอต้อนรับนะครับ เดินทางปลอดภัยครับ",
            size: "sm",
            color: INK_2,
            wrap: true,
            margin: "lg",
          },
        ],
      },
      footer: warmNoteFooter({
        accent: REMINDER.accent,
        primaryLabel: "ดูคิวของฉัน",
        primaryUrl: input.myBookingsUrl,
        linkLabel: "เลื่อน / ยกเลิกนัด",
        linkUrl: showCancelLink ? input.cancelUrl : null,
      }),
    },
  };
}

/**
 * Option A · Warm Note — customer self-reschedule success (confirm green).
 * Link is cancel-only (`ยกเลิกนัด`) because the one reschedule is already used.
 */
export function buildCustomerRescheduleTicketFlex(input: {
  shopName: string;
  oldStartTime: string;
  oldEndTime: string;
  newStartTime: string;
  newEndTime: string;
  barberName: string;
  myBookingsUrl: string;
  cancelUrl?: string | null;
  now?: Date;
}) {
  const date = whenLabel(input.newStartTime);
  const time = timeRange(input.newStartTime, input.newEndTime);
  const oldLabel = `${whenLabel(input.oldStartTime)} ${timeRange(input.oldStartTime, input.oldEndTime)}`;
  const showCancelLink =
    Boolean(input.cancelUrl?.trim()) &&
    canCancelAt(input.newStartTime, input.now ?? new Date());

  return {
    type: "flex",
    altText: `✓ เลื่อนคิวแล้ว ${date} ${time} กับช่าง ${input.barberName}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: warmNoteHeader(
        input.shopName,
        "✓ เลื่อนคิวเรียบร้อยแล้ว",
        CONFIRM.accentText,
        CONFIRM.tint,
      ),
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        paddingTop: "16px",
        contents: [
          {
            type: "text",
            text: date,
            size: "md",
            color: INK_2,
            weight: "bold",
          },
          {
            type: "text",
            text: time,
            size: "xxl",
            color: INK,
            weight: "bold",
          },
          { type: "separator", margin: "lg", color: LINE },
          detailRow("ช่าง", input.barberName, "lg"),
          detailRow("เลื่อนจาก", oldLabel, "md", { struck: true }),
          {
            type: "text",
            text: "เลื่อนคิวเรียบร้อยครับ แล้วเจอกันที่ร้าน",
            size: "sm",
            color: INK_2,
            wrap: true,
            margin: "lg",
          },
        ],
      },
      footer: warmNoteFooter({
        accent: CONFIRM.accent,
        primaryLabel: "ดูคิวของฉัน",
        primaryUrl: input.myBookingsUrl,
        linkLabel: "ยกเลิกนัด",
        linkUrl: showCancelLink ? input.cancelUrl : null,
      }),
    },
  };
}
