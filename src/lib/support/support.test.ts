import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { deriveShopActivation } from "@/lib/onboarding/activation";
import {
  buildCrashFingerprint,
  shouldNotifyCrashOccurrence,
} from "@/lib/support/crash-fingerprint";
import { deriveSupportChecklist } from "@/lib/support/checklist";
import {
  getSupportTicketStore,
  resetMemorySupportTicketStore,
} from "@/lib/support/ticket-store";

describe("support checklist", () => {
  it("tracks 5 onboarding items with progress", () => {
    const activation = deriveShopActivation({
      shopStatus: "active",
      shopName: "Demo",
      hours: null,
      barbers: [
        {
          id: "b1",
          name: "A",
          slot_duration_minutes: 30,
          off_days: [],
          created_at: new Date().toISOString(),
          is_active: true,
          is_bookable: true,
        },
      ],
      appointmentCount: 0,
    });
    const progress = deriveSupportChecklist({
      activation,
      servicesOk: false,
      adminBasePath: "/s/admin",
    });
    assert.equal(progress.total, 5);
    assert.equal(progress.items.find((i) => i.id === "shop_info")?.done, true);
    assert.equal(progress.items.find((i) => i.id === "barbers")?.done, true);
    assert.equal(progress.items.find((i) => i.id === "services")?.done, false);
    assert.equal(progress.items.find((i) => i.id === "test_booking")?.done, false);
    assert.equal(progress.allDone, false);
  });
});

describe("crash fingerprint + notify thresholds", () => {
  it("stable fingerprint for same error", () => {
    const a = buildCrashFingerprint({
      message: "boom",
      digest: "d1",
      pagePath: "/admin",
    });
    const b = buildCrashFingerprint({
      message: "boom",
      digest: "d1",
      pagePath: "/admin",
    });
    assert.equal(a, b);
    assert.notEqual(
      a,
      buildCrashFingerprint({ message: "boom", digest: "d2", pagePath: "/admin" }),
    );
  });

  it("notifies on new and frequent thresholds only", () => {
    assert.equal(shouldNotifyCrashOccurrence(1), true);
    assert.equal(shouldNotifyCrashOccurrence(2), false);
    assert.equal(shouldNotifyCrashOccurrence(5), true);
    assert.equal(shouldNotifyCrashOccurrence(6), false);
    assert.equal(shouldNotifyCrashOccurrence(10), true);
  });
});

describe("support ticket store (memory)", () => {
  beforeEach(() => {
    resetMemorySupportTicketStore();
  });

  it("creates tickets, lists by shop, replies, and dedupes crash", async () => {
    const store = getSupportTicketStore();
    const ticket = await store.createTicket({
      shopId: "shop-1",
      reporterLineUserId: "U1",
      type: "problem",
      body: "จองไม่ได้",
    });
    assert.equal(ticket.status, "new");
    const list = await store.listTicketsForShop("shop-1");
    assert.equal(list.length, 1);

    const crash = await store.createTicket({
      shopId: "shop-1",
      reporterLineUserId: "U1",
      type: "crash",
      body: "TypeError",
      errorFingerprint: "fp1",
    });
    const found = await store.findOpenCrashByFingerprint("shop-1", "fp1");
    assert.equal(found?.id, crash.id);
    const bumped = await store.incrementCrashOccurrence(crash.id);
    assert.equal(bumped.occurrence_count, 2);

    const reply = await store.addReply(ticket.id, "operator", "กำลังดูให้");
    assert.equal(reply.author_role, "operator");
    const replies = await store.listReplies(ticket.id);
    assert.equal(replies.length, 1);

    const done = await store.updateTicketStatus(ticket.id, "done");
    assert.equal(done.status, "done");
  });
});
