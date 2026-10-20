import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { dictionary } from "@/lib/i18n/dictionary";

describe("admin tap feedback + walk-in pending UX", () => {
  it("globals define cq-press active state and spinner", () => {
    const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
    assert.match(css, /\.cq-press/);
    assert.match(css, /touch-action:\s*manipulation/);
    assert.match(css, /:active/);
    assert.match(css, /scale\(0\.97\)/);
    assert.match(css, /\.cq-btn-spinner/);
  });

  it("ToastProvider enables iOS :active via touchstart listener", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/components/ui/ToastProvider.tsx"),
      "utf8",
    );
    assert.match(src, /touchstart/);
  });

  it("StaffBookingSheet Walk-in shows Thai pending label + cq-press", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/components/admin/StaffBookingSheet.tsx"),
      "utf8",
    );
    assert.match(src, /cq-press/);
    assert.match(src, /admin\.staffBook\.walkInPending/);
    assert.match(src, /cq-btn-spinner/);
    assert.match(src, /data-testid="staff-book-walk-in"/);
  });

  it("Thai copy: กำลังลงคิว… and ลงคิวแล้ว", () => {
    assert.equal(dictionary.th["admin.staffBook.walkInPending"], "กำลังลงคิว…");
    assert.equal(dictionary.th["admin.toast.walkInQueued"], "ลงคิวแล้ว");
  });

  it("createStaffBooking succeeds without awaiting loadDay (snappy pending clear)", () => {
    const page = readFileSync(resolve(process.cwd(), "src/app/admin/page.tsx"), "utf8");
    assert.match(page, /toast\.success\(\s*[\s\S]*admin\.toast\.walkInQueued/);
    assert.match(page, /void loadDay\(\)/);
    assert.match(page, /alreadyPending:\s*true/);
    assert.match(page, /uiKey/);
  });
});
