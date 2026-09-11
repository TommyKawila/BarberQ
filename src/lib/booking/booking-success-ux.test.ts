import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { shouldShowLineReminder } from "@/lib/booking/booking-success-ux";
import { dictionary } from "@/lib/i18n/dictionary";

const root = resolve(import.meta.dirname, "../..");

describe("booking success LINE reminder visibility", () => {
  it("shows when URL is set and not already a friend", () => {
    assert.equal(shouldShowLineReminder("https://line.me/R/ti/p/@barberqx", false), true);
  });

  it("hides when URL is missing", () => {
    assert.equal(shouldShowLineReminder("", false), false);
    assert.equal(shouldShowLineReminder("   ", false), false);
    assert.equal(shouldShowLineReminder(undefined, false), false);
  });

  it("hides when already a friend", () => {
    assert.equal(shouldShowLineReminder("https://line.me/R/ti/p/@barberqx", true), false);
  });
});

describe("booking success source", () => {
  it("uses the chair asset, object-contain, and unchanged routes", () => {
    const success = readFileSync(
      resolve(root, "components/customer/BookingSuccess.tsx"),
      "utf8",
    );
    const app = readFileSync(resolve(root, "components/customer/BookingApp.tsx"), "utf8");
    const post = readFileSync(resolve(root, "app/api/[shop]/bookings/route.ts"), "utf8");
    assert.match(success, /\/images\/booking-success-chair\.png/);
    assert.match(success, /object-contain/);
    assert.doesNotMatch(success, /object-cover/);
    assert.doesNotMatch(success, /✅/);
    assert.doesNotMatch(success, /CircleCheck/);
    assert.doesNotMatch(success, /https:\/\/line\.me/);
    assert.match(success, /NEXT_PUBLIC_LINE_OA_ADD_URL/);
    assert.match(success, /shopPath\("\/bookings"\)/);
    assert.match(success, /booking.viewMyBookings/);
    assert.match(success, /booking.backToShop/);
    assert.match(app, /BookingSuccess/);
    assert.match(app, /setSuccess/);
    assert.match(post, /createBookingForShop/);
  });

  it("dictionary confirms LINE copy without pre-appointment reminder claims", () => {
    const keys = [
      "booking.successReminderTitle",
      "booking.successReminderBody",
      "booking.successAddFriend",
      "booking.successReminderHint",
    ] as const;
    for (const key of keys) {
      assert.match(dictionary.th[key], /\S/);
      assert.match(dictionary.en[key], /\S/);
      assert.doesNotMatch(dictionary.th[key], /ก่อนถึงเวลานัด/);
      assert.doesNotMatch(dictionary.en[key], /before your appointment/i);
    }
    assert.equal(dictionary.th["booking.successReminderHint"], "ไม่บังคับ • คิวของคุณยืนยันแล้ว");
  });
});
