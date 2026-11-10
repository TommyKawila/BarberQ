import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isStandaloneDisplay } from "@/lib/pwa/standalone-display";

describe("isStandaloneDisplay", () => {
  it("detects navigator.standalone", () => {
    const win = {
      navigator: { standalone: true },
      matchMedia: () => ({ matches: false }),
    } as unknown as Window & { navigator: Navigator & { standalone?: boolean } };
    assert.equal(isStandaloneDisplay(win), true);
  });

  it("detects display-mode standalone", () => {
    const win = {
      navigator: {},
      matchMedia: (q: string) => ({
        matches: q.includes("standalone"),
      }),
    } as unknown as Window & { navigator: Navigator & { standalone?: boolean } };
    assert.equal(isStandaloneDisplay(win), true);
  });

  it("OwnerEntry manual login has handoff timeout (no forever กำลังตรวจสอบ)", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/components/owner/OwnerEntry.tsx"),
      "utf8",
    );
    assert.match(src, /OWNER_LIFF_LOGIN_HANDOFF_TIMEOUT_MS/);
    assert.match(src, /isStandaloneDisplay/);
    assert.match(src, /owner-entry-standalone-hint/);
    assert.match(src, /manualLoginTimerRef/);
  });
});
