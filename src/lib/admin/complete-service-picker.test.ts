import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  activeShopServices,
  closeQueueConfirmLabel,
  defaultActiveService,
  formatServicePriceBaht,
  shouldPromptServicePicker,
} from "@/lib/admin/complete-service-picker";
import { dictionary } from "@/lib/i18n/dictionary";
import type { ShopService } from "@/types/booking";

function svc(
  partial: Partial<ShopService> & Pick<ShopService, "id" | "name" | "price_baht">,
): ShopService {
  return {
    shop_id: "shop",
    is_default: false,
    is_active: true,
    sort_order: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("complete service picker helpers", () => {
  it("prompts only when more than one active service", () => {
    assert.equal(shouldPromptServicePicker([]), false);
    assert.equal(
      shouldPromptServicePicker([svc({ id: "a", name: "A", price_baht: 200 })]),
      false,
    );
    assert.equal(
      shouldPromptServicePicker([
        svc({ id: "a", name: "A", price_baht: 200 }),
        svc({ id: "b", name: "B", price_baht: 250 }),
      ]),
      true,
    );
    assert.equal(
      shouldPromptServicePicker([
        svc({ id: "a", name: "A", price_baht: 200 }),
        svc({ id: "b", name: "B", price_baht: 250, is_active: false }),
      ]),
      false,
    );
  });

  it("prefers default among active services", () => {
    const list = [
      svc({ id: "a", name: "A", price_baht: 200, sort_order: 0 }),
      svc({ id: "b", name: "B", price_baht: 250, is_default: true, sort_order: 1 }),
    ];
    assert.equal(defaultActiveService(list)?.id, "b");
    assert.deepEqual(
      activeShopServices(list).map((s) => s.id),
      ["b", "a"],
    );
  });

  it("Thai confirm CTA includes price", () => {
    assert.equal(
      closeQueueConfirmLabel(dictionary.th["admin.closeQueueConfirm"], 200),
      "ปิดคิว · ฿200",
    );
    assert.equal(formatServicePriceBaht(250), "฿250");
  });

  it("admin page gates complete behind picker when multi-service", () => {
    const page = readFileSync(resolve(process.cwd(), "src/app/admin/page.tsx"), "utf8");
    assert.match(page, /shouldPromptServicePicker/);
    assert.match(page, /CompleteServicePicker/);
    assert.match(page, /requestComplete/);
    assert.match(page, /\/api\/appointments\/\$\{.*\}\/service/);
  });

  it("completed cards can reopen sheet to change service", () => {
    const actions = readFileSync(
      resolve(process.cwd(), "src/lib/admin/board-card-actions.ts"),
      "utf8",
    );
    assert.match(actions, /canChangeService/);
    assert.match(actions, /status === "completed"/);
  });
});
