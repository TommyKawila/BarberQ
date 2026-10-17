import { formatInTimeZone } from "date-fns-tz";
import { th } from "date-fns/locale";
import { canCancelAt, SHOP_TIMEZONE } from "@/lib/services/slot-service";
import { bookingShortCode } from "@/lib/line/booking-code";

/** Option A · Warm Note tokens (confirm = green, reminder = amber). */
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

function whenLabel(iso: string): string {
  return formatInTimeZone(new Date(iso), SHOP_TIMEZONE, "EEE d MMM", { locale: th });
}

function timeRange(startIso: string, endIso: string): string {
  const start = formatInTimeZone(new Date(startIso), SHOP_TIMEZONE, "HH:mm");
  const end = formatInTimeZone(new Date(endIso), SHOP_TIMEZONE, "HH:mm");
  return `${start}–${end}`;
}

function detailRow(label: string, value: string, margin: "lg" | "md") {
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
        color: INK,
        weight: "bold",
        flex: 5,
        wrap: true,
      },
    ],
  };
}

function warmNoteFooter(opts: {
  accent: string;
  myBookingsUrl: string;
  cancelUrl?: string | null;
}) {
  const contents: unknown[] = [
    {
      type: "button",
      style: "primary",
      color: opts.accent,
      height: "md",
      action: {
        type: "uri",
        label: "ดูคิวของฉัน",
        uri: opts.myBookingsUrl,
      },
    },
  ];
  if (opts.cancelUrl) {
    contents.push({
      type: "button",
      style: "link",
      color: INK_2,
      height: "sm",
      action: {
        type: "uri",
        label: "เลื่อน / ยกเลิกนัด",
        uri: opts.cancelUrl,
      },
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
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: CONFIRM.tint,
        paddingAll: "20px",
        paddingBottom: "16px",
        contents: [
          {
            type: "text",
            text: input.shopName,
            size: "lg",
            color: INK,
            weight: "bold",
            wrap: true,
            maxLines: 2,
          },
          {
            type: "text",
            text: "✓ จองคิวเรียบร้อยแล้ว",
            size: "sm",
            color: CONFIRM.accentText,
            weight: "bold",
            margin: "xs",
          },
        ],
      },
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
        myBookingsUrl: input.myBookingsUrl,
        cancelUrl: input.cancelUrl,
      }),
    },
  };
}

export function buildQueueTicketFlex(input: {
  shopName: string;
  queueLabel: string;
  aheadCount: number;
  waitMinutes: number;
  liveUrl: string;
}) {
  return {
    type: "flex",
    altText: `${input.shopName}: บัตรคิว ${input.queueLabel}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#18181B",
        paddingAll: "16px",
        contents: [
          {
            type: "text",
            text: input.shopName,
            color: "#FBBF24",
            size: "xs",
          },
          {
            type: "text",
            text: "บัตรคิวของคุณ",
            color: "#FFFFFF",
            weight: "bold",
            size: "lg",
            margin: "sm",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "คิวของคุณ",
            size: "sm",
            color: "#71717A",
          },
          {
            type: "text",
            text: input.queueLabel,
            size: "3xl",
            weight: "bold",
            color: "#18181B",
            margin: "sm",
          },
          {
            type: "text",
            text: `ก่อนหน้า ${input.aheadCount} คิว · รอประมาณ ${input.waitMinutes} นาที`,
            size: "sm",
            color: "#52525B",
            margin: "md",
            wrap: true,
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#18181B",
            action: {
              type: "uri",
              label: "ดูสถานะสด",
              uri: input.liveUrl,
            },
          },
        ],
      },
    },
  };
}

export function buildShopCancelFlex(input: {
  shopName: string;
  startTime: string;
  barberName: string;
  reason?: string | null;
  bookUrl: string;
  callUrl?: string | null;
}) {
  const contents: unknown[] = [
    row("นัด", `${whenLabel(input.startTime)} ${formatInTimeZone(new Date(input.startTime), SHOP_TIMEZONE, "HH:mm")}`, true),
    row("ช่าง", input.barberName),
  ];
  if (input.reason) contents.push(row("เหตุผล", input.reason));

  const footerButtons: unknown[] = [
    {
      type: "button",
      style: "primary",
      color: "#18181B",
      action: { type: "uri", label: "จองเวลาใหม่", uri: input.bookUrl },
    },
  ];
  if (input.callUrl) {
    footerButtons.push({
      type: "button",
      style: "secondary",
      action: { type: "uri", label: "โทรหาร้าน", uri: input.callUrl },
    });
  }

  return {
    type: "flex",
    altText: `${input.shopName}: ร้านยกเลิกนัดของคุณ`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#DC2626",
        paddingAll: "16px",
        contents: [
          { type: "text", text: input.shopName, color: "#FECACA", size: "xs" },
          {
            type: "text",
            text: "ร้านยกเลิกนัดของคุณ",
            color: "#FFFFFF",
            weight: "bold",
            size: "lg",
            margin: "sm",
            wrap: true,
          },
        ],
      },
      body: { type: "box", layout: "vertical", spacing: "md", contents },
      footer: { type: "box", layout: "vertical", spacing: "sm", contents: footerButtons },
    },
  };
}

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
  const contents: unknown[] = [
    row(
      "เดิม",
      `${whenLabel(input.oldStartTime)} ${formatInTimeZone(new Date(input.oldStartTime), SHOP_TIMEZONE, "HH:mm")}`,
    ),
    row(
      "ใหม่",
      `${whenLabel(input.newStartTime)} ${formatInTimeZone(new Date(input.newStartTime), SHOP_TIMEZONE, "HH:mm")}`,
      true,
    ),
    row("ช่าง", input.barberName),
  ];
  if (input.reason) contents.push(row("เหตุผล", input.reason));

  return {
    type: "flex",
    altText: `${input.shopName}: ร้านขอเลื่อนนัดของคุณ`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#EA580C",
        paddingAll: "16px",
        contents: [
          { type: "text", text: input.shopName, color: "#FFEDD5", size: "xs" },
          {
            type: "text",
            text: "ร้านขอเลื่อนนัดของคุณ",
            color: "#FFFFFF",
            weight: "bold",
            size: "lg",
            margin: "sm",
            wrap: true,
          },
        ],
      },
      body: { type: "box", layout: "vertical", spacing: "md", contents },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#18181B",
            action: { type: "uri", label: "ตกลง เวลาใหม่", uri: input.acceptUrl },
          },
          {
            type: "button",
            style: "secondary",
            action: { type: "uri", label: "เลือกเวลาอื่น", uri: input.pickUrl },
          },
          {
            type: "button",
            style: "secondary",
            action: { type: "uri", label: "ยกเลิกนัด", uri: input.cancelUrl },
          },
        ],
      },
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
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: REMINDER.tint,
        paddingAll: "20px",
        paddingBottom: "16px",
        contents: [
          {
            type: "text",
            text: input.shopName,
            size: "lg",
            color: INK,
            weight: "bold",
            wrap: true,
            maxLines: 2,
          },
          {
            type: "text",
            text: "ใกล้ถึงคิวของคุณแล้ว",
            size: "sm",
            color: REMINDER.accentText,
            weight: "bold",
            margin: "xs",
          },
        ],
      },
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
        myBookingsUrl: input.myBookingsUrl,
        cancelUrl: showCancelLink ? input.cancelUrl : null,
      }),
    },
  };
}

function row(label: string, value: string, bold = false, struck = false) {
  return {
    type: "box",
    layout: "baseline",
    contents: [
      { type: "text", text: label, size: "sm", color: "#71717A", flex: 2 },
      {
        type: "text",
        text: value,
        size: "sm",
        color: struck ? "#A1A1AA" : "#18181B",
        flex: 5,
        wrap: true,
        weight: bold ? "bold" : "regular",
        ...(struck ? { decoration: "line-through" } : {}),
      },
    ],
  };
}

/** Customer self-reschedule queue ticket (new slot + old time struck through). */
export function buildCustomerRescheduleTicketFlex(input: {
  shopName: string;
  oldStartTime: string;
  oldEndTime: string;
  newStartTime: string;
  newEndTime: string;
  barberName: string;
  myBookingsUrl: string;
  cancelUrl: string;
}) {
  const oldLabel = `${whenLabel(input.oldStartTime)} ${timeRange(input.oldStartTime, input.oldEndTime)}`;
  return {
    type: "flex",
    altText: `${input.shopName}: เลื่อนคิวสำเร็จแล้ว`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#EA580C",
        paddingAll: "16px",
        contents: [
          { type: "text", text: input.shopName, color: "#FFEDD5", size: "xs" },
          {
            type: "text",
            text: "✓ เลื่อนคิวสำเร็จแล้ว",
            color: "#FFFFFF",
            weight: "bold",
            size: "lg",
            margin: "sm",
            wrap: true,
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          row("วัน", whenLabel(input.newStartTime)),
          row("เวลา", timeRange(input.newStartTime, input.newEndTime), true),
          row("ช่าง", input.barberName),
          row("เลื่อนจาก", oldLabel, false, true),
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#18181B",
            action: {
              type: "uri",
              label: "ดูคิวของฉัน",
              uri: input.myBookingsUrl,
            },
          },
          {
            type: "button",
            style: "secondary",
            action: {
              type: "uri",
              label: "เลื่อน/ยกเลิก",
              uri: input.cancelUrl,
            },
          },
        ],
      },
    },
  };
}
