import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fromZonedTime } from "date-fns-tz";
import {
  buildAppointmentReminderFlex,
  buildBookingConfirmFlex,
} from "@/lib/line/flex-messages";
import { SHOP_TIMEZONE } from "@/lib/services/slot-service";

const SHOP = "BarberQx Demo";
const BARBER = "นัท · Nat";
const MY = "https://example.com/demo/bookings";
const CANCEL = "https://example.com/demo/c/tok";
/** Sun 18 Oct 2026 18:30–19:30 ICT */
const START = fromZonedTime("2026-10-18T18:30:00", SHOP_TIMEZONE).toISOString();
const END = fromZonedTime("2026-10-18T19:30:00", SHOP_TIMEZONE).toISOString();
const APPT_ID = "00000000-0000-4000-8000-00000000a12f";

const FLEX_SIZES = new Set([
  "xxs",
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "xxl",
  "3xl",
  "4xl",
  "5xl",
]);
const FLEX_MARGINS = new Set(["none", "xs", "sm", "md", "lg", "xl", "xxl"]);
const FLEX_WEIGHTS = new Set(["regular", "bold"]);
const BUTTON_STYLES = new Set(["primary", "secondary", "link"]);
const BUTTON_HEIGHTS = new Set(["sm", "md"]);

type FlexNode = Record<string, unknown>;

function walk(node: unknown, visit: (n: FlexNode) => void) {
  if (Array.isArray(node)) {
    for (const item of node) walk(item, visit);
    return;
  }
  if (!node || typeof node !== "object") return;
  visit(node as FlexNode);
  for (const v of Object.values(node)) walk(v, visit);
}

/** Validate common LINE Flex Message Object constraints used by our builders. */
function assertValidFlexMessage(msg: { type: string; altText: string; contents: unknown }) {
  assert.equal(msg.type, "flex");
  assert.ok(msg.altText.length > 0 && msg.altText.length <= 400);
  const bubble = msg.contents as FlexNode;
  assert.equal(bubble.type, "bubble");
  assert.equal(bubble.size, "mega");

  let primaryCount = 0;
  walk(msg.contents, (n) => {
    if (n.type === "text") {
      assert.ok(typeof n.text === "string" && n.text.length > 0);
      if (n.size != null) assert.ok(FLEX_SIZES.has(String(n.size)), `bad size ${n.size}`);
      if (n.weight != null) assert.ok(FLEX_WEIGHTS.has(String(n.weight)));
      if (n.margin != null) assert.ok(FLEX_MARGINS.has(String(n.margin)));
      if (n.color != null) assert.match(String(n.color), /^#[0-9A-Fa-f]{6}$/);
      if (n.maxLines != null) assert.ok(Number(n.maxLines) >= 1);
    }
    if (n.type === "separator" && n.margin != null) {
      assert.ok(FLEX_MARGINS.has(String(n.margin)));
    }
    if (n.type === "button") {
      assert.ok(BUTTON_STYLES.has(String(n.style)), `bad button style ${n.style}`);
      if (n.height != null) assert.ok(BUTTON_HEIGHTS.has(String(n.height)));
      if (n.color != null) assert.match(String(n.color), /^#[0-9A-Fa-f]{6}$/);
      const action = n.action as FlexNode | undefined;
      assert.ok(action);
      assert.equal(action.type, "uri");
      assert.ok(typeof action.label === "string" && String(action.label).length <= 40);
      assert.match(String(action.uri), /^https:\/\//);
      if (n.style === "primary") primaryCount += 1;
    }
  });
  assert.equal(primaryCount, 1, "exactly one primary button");
}

function footerButtons(msg: { contents: unknown }) {
  const footer = (msg.contents as { footer: { contents: FlexNode[] } }).footer;
  return footer.contents;
}

function confirmInput() {
  return {
    shopName: SHOP,
    startTime: START,
    endTime: END,
    barberName: BARBER,
    appointmentId: APPT_ID,
    myBookingsUrl: MY,
    cancelUrl: CANCEL,
  };
}

describe("buildBookingConfirmFlex (Option A)", () => {
  it("builds mega warm-note structure with green tokens and booking no.", () => {
    const msg = buildBookingConfirmFlex(confirmInput());
    assertValidFlexMessage(msg);

    const c = msg.contents as {
      header: { backgroundColor: string; contents: Array<{ text: string; size: string }> };
      body: { contents: Array<Record<string, unknown>> };
    };
    assert.equal(c.header.backgroundColor, "#ECFDF3");
    assert.equal(c.header.contents[0]?.text, SHOP);
    assert.equal(c.header.contents[0]?.size, "lg");
    assert.equal(c.header.contents[1]?.text, "✓ จองคิวเรียบร้อยแล้ว");

    const bodyTexts = c.body.contents
      .filter((n) => n.type === "text")
      .map((n) => n.text as string);
    assert.ok(bodyTexts.some((t) => /18:30–19:30/.test(t)));
    assert.ok(
      bodyTexts.includes("ขอบคุณที่ให้เราดูแลนะครับ แล้วเจอกันที่ร้าน"),
    );

    const rows = c.body.contents.filter((n) => n.type === "box") as Array<{
      contents: Array<{ text: string }>;
    }>;
    assert.ok(rows.some((r) => r.contents[0]?.text === "ช่าง" && r.contents[1]?.text === BARBER));
    assert.ok(rows.some((r) => r.contents[0]?.text === "เลขที่จอง"));

    const buttons = footerButtons(msg);
    assert.equal(buttons.length, 2);
    assert.equal(buttons[0]?.style, "primary");
    assert.equal(buttons[0]?.color, "#15803D");
    assert.equal((buttons[0]?.action as { label: string }).label, "ดูคิวของฉัน");
    assert.equal(buttons[1]?.style, "link");
    assert.equal((buttons[1]?.action as { label: string }).label, "เลื่อน / ยกเลิกนัด");
  });

  it("altText is status + date + time + barber (no shop name)", () => {
    const msg = buildBookingConfirmFlex(confirmInput());
    assert.match(msg.altText, /^✓ จองคิวแล้ว /);
    assert.match(msg.altText, /18:30–19:30/);
    assert.match(msg.altText, /กับช่าง นัท · Nat$/);
    assert.ok(!msg.altText.includes(SHOP));
  });
});

describe("buildAppointmentReminderFlex (Option A)", () => {
  const base = {
    shopName: SHOP,
    startTime: START,
    endTime: END,
    barberName: BARBER,
    myBookingsUrl: MY,
    cancelUrl: CANCEL,
  };

  it("builds amber warm-note without booking-no row", () => {
    const now = fromZonedTime("2026-10-17T18:30:00", SHOP_TIMEZONE); // 24h lead
    const msg = buildAppointmentReminderFlex({ ...base, now });
    assertValidFlexMessage(msg);

    const c = msg.contents as {
      header: { backgroundColor: string; contents: Array<{ text: string }> };
      body: { contents: Array<Record<string, unknown>> };
    };
    assert.equal(c.header.backgroundColor, "#FFF4E0");
    assert.equal(c.header.contents[1]?.text, "ใกล้ถึงคิวของคุณแล้ว");
    assert.ok(
      !c.body.contents.some(
        (n) =>
          n.type === "box" &&
          Array.isArray(n.contents) &&
          (n.contents as Array<{ text?: string }>)[0]?.text === "เลขที่จอง",
      ),
    );
    assert.ok(
      c.body.contents.some(
        (n) => n.type === "text" && n.text === "ร้านรอต้อนรับนะครับ เดินทางปลอดภัยครับ",
      ),
    );

    const buttons = footerButtons(msg);
    assert.equal(buttons.length, 2);
    assert.equal(buttons[0]?.style, "primary");
    assert.equal(buttons[0]?.color, "#B45309");
    assert.equal(buttons[1]?.style, "link");
  });

  it("shows cancel link only when cancelUrl set and ≥60 min before start", () => {
    const withLink = buildAppointmentReminderFlex({
      ...base,
      now: fromZonedTime("2026-10-18T17:30:00", SHOP_TIMEZONE), // exactly 60 min
    });
    assert.equal(footerButtons(withLink).length, 2);
    assertValidFlexMessage(withLink);

    const tooLate = buildAppointmentReminderFlex({
      ...base,
      now: fromZonedTime("2026-10-18T17:31:00", SHOP_TIMEZONE), // 59 min
    });
    assert.equal(footerButtons(tooLate).length, 1);
    assert.equal(footerButtons(tooLate)[0]?.style, "primary");
    assertValidFlexMessage(tooLate);
  });

  it("hides cancel link when cancelUrl missing even if ≥60 min", () => {
    const msg = buildAppointmentReminderFlex({
      ...base,
      cancelUrl: null,
      now: fromZonedTime("2026-10-17T18:30:00", SHOP_TIMEZONE),
    });
    assert.equal(footerButtons(msg).length, 1);
    assertValidFlexMessage(msg);
  });

  it("altText is status + date + time + barber", () => {
    const msg = buildAppointmentReminderFlex({
      ...base,
      now: fromZonedTime("2026-10-17T18:30:00", SHOP_TIMEZONE),
    });
    assert.match(msg.altText, /^ใกล้ถึงคิวแล้ว /);
    assert.match(msg.altText, /18:30–19:30/);
    assert.match(msg.altText, /กับช่าง นัท · Nat$/);
    assert.ok(!msg.altText.includes(SHOP));
  });
});
