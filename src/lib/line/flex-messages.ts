import { formatInTimeZone } from "date-fns-tz";
import { th } from "date-fns/locale";
import { SHOP_TIMEZONE } from "@/lib/services/slot-service";
import { bookingShortCode } from "@/lib/line/booking-code";

function whenLabel(iso: string): string {
  return formatInTimeZone(new Date(iso), SHOP_TIMEZONE, "EEE d MMM", { locale: th });
}

function timeRange(startIso: string, endIso: string): string {
  const start = formatInTimeZone(new Date(startIso), SHOP_TIMEZONE, "HH:mm");
  const end = formatInTimeZone(new Date(endIso), SHOP_TIMEZONE, "HH:mm");
  return `${start}–${end}`;
}

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
  return {
    type: "flex",
    altText: `${input.shopName}: จองคิวสำเร็จแล้ว`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#16A34A",
        paddingAll: "16px",
        contents: [
          {
            type: "text",
            text: input.shopName,
            color: "#DCFCE7",
            size: "xs",
          },
          {
            type: "text",
            text: "✓ จองคิวสำเร็จแล้ว",
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
        spacing: "md",
        contents: [
          row("วัน", whenLabel(input.startTime)),
          row("เวลา", timeRange(input.startTime, input.endTime), true),
          row("ช่าง", input.barberName),
          row("เลขที่", `#${code}`),
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

export function buildAppointmentReminderFlex(input: {
  shopName: string;
  startTime: string;
  endTime: string;
  barberName: string;
  myBookingsUrl: string;
}) {
  return {
    type: "flex",
    altText: `${input.shopName}: เตือนคิวที่จองไว้`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#2563EB",
        paddingAll: "16px",
        contents: [
          { type: "text", text: input.shopName, color: "#DBEAFE", size: "xs" },
          {
            type: "text",
            text: "เตือนคิวที่จองไว้",
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
        spacing: "md",
        contents: [
          row("วัน", whenLabel(input.startTime)),
          row("เวลา", timeRange(input.startTime, input.endTime), true),
          row("ช่าง", input.barberName),
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
        ],
      },
    },
  };
}

function row(label: string, value: string, bold = false) {
  return {
    type: "box",
    layout: "baseline",
    contents: [
      { type: "text", text: label, size: "sm", color: "#71717A", flex: 2 },
      {
        type: "text",
        text: value,
        size: "sm",
        color: "#18181B",
        flex: 5,
        wrap: true,
        weight: bold ? "bold" : "regular",
      },
    ],
  };
}
