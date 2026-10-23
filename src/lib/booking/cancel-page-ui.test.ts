import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { dictionary } from "@/lib/i18n/dictionary";

const root = resolve(import.meta.dirname, "../..");

describe("cancel page UI wiring (/c/{token})", () => {
  it("CancelClient reuses RescheduleFlow + cancelPageActions", () => {
    const src = readFileSync(
      resolve(root, "components/customer/CancelClient.tsx"),
      "utf8",
    );
    assert.match(src, /from "@\/components\/customer\/RescheduleFlow"/);
    assert.match(src, /from "@\/lib\/booking\/cancel-page-actions"/);
    assert.match(src, /data-testid="cancel-page-reschedule"/);
    assert.match(src, /data-testid="cancel-page-cancel"/);
    assert.match(src, /ShopSlugProvider/);
    // Primary amber reschedule, secondary cancel when both available
    assert.match(src, /bg-amber-400/);
    assert.match(src, /border-zinc-600/);
  });

  it("page passes shopSlug + hours into CancelClient", () => {
    const src = readFileSync(resolve(root, "app/(app)/c/[token]/page.tsx"), "utf8");
    assert.match(src, /shopSlug=\{shop\?\.slug/);
    assert.match(src, /hours=\{normalizeShopHours/);
  });

  it("Thai title covers both actions and keeps ครับ-free page words intact", () => {
    assert.equal(dictionary.th["cancel.title"], "เลื่อนหรือยกเลิกคิว");
    assert.equal(dictionary.th["booking.reschedule"], "เลื่อนคิว");
    assert.equal(dictionary.th["booking.cancel"], "ยกเลิกการจอง");
    assert.equal(dictionary.th["booking.rescheduleUsed"], "เลื่อนคิวแล้ว (ครบ 1 ครั้ง)");
  });

  it("splits within-cutoff vs past (เลยกำหนด) cancel-blocked copy", () => {
    assert.match(
      dictionary.th["booking.cancelWithinCutoffDetail"],
      /เหลือไม่ถึง \{minutes\} นาที/,
    );
    assert.equal(
      dictionary.th["booking.cancelTooLateDetail"],
      "นัดนี้เลยกำหนดแล้ว กรุณาติดต่อร้าน",
    );
    assert.doesNotMatch(
      dictionary.th["booking.cancelWithinCutoffDetail"],
      /เลยกำหนด/,
    );
  });
});
