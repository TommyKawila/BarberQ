import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { dictionary } from "@/lib/i18n/dictionary";
import { FOUNDER_QA_MANIFEST } from "@/lib/founder-qa/manifest";

const ROOT = process.cwd();

function read(rel: string) {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

describe("ClipperQ brand leftovers (PLAN-1 PR-B)", () => {
  it("QR download filename uses clipperq- prefix", () => {
    const src = read("src/app/admin/settings/qr-queue/page.tsx");
    assert.match(src, /clipperq-qr-queue-\$\{shopSlug\}\.png/);
    assert.doesNotMatch(src, /barberqx-qr-queue-/);
    assert.doesNotMatch(src, /BarberQ|BarberQx/);
  });

  it("LINE contact-team copy has no BarberQ/BarberQx and is a tappable support link", () => {
    assert.equal(dictionary.th["lineConnect.contactTeamViaLine"], "ติดต่อทีมทาง LINE");
    assert.equal(
      dictionary.en["lineConnect.contactTeamViaLine"],
      "Contact the team on LINE",
    );
    assert.doesNotMatch(dictionary.th["lineConnect.contactTeamViaLine"], /BarberQ|BarberQx/i);
    assert.doesNotMatch(dictionary.en["lineConnect.contactTeamViaLine"], /BarberQ|BarberQx/i);
    const linePage = read("src/app/admin/settings/line/page.tsx");
    assert.match(linePage, /href=\{SUPPORT_LINE_URL\}/);
    assert.match(linePage, /SUPPORT_LINE_URL \? \([\s\S]*contactTeamViaLine[\s\S]*\) : null/);
    assert.match(linePage, /data-testid="line-settings-help-card"/);
    assert.match(linePage, /if \(!SUPPORT_LINE_URL\) return null/);
    assert.equal(dictionary.th["lineConnect.helpTitle"], "ติดตรงไหน? ให้ทีมช่วย");
  });

  it("pilot checklist and founder-qa display name are ClipperQ Pilot Test", () => {
    assert.equal(FOUNDER_QA_MANIFEST.shop.name, "ClipperQ Pilot Test");
    assert.equal(FOUNDER_QA_MANIFEST.shop.slug, "barberqpilottest");
    const checklist = read("src/lib/pilot/checklist.ts");
    assert.match(checklist, /สร้างร้าน ClipperQ Pilot Test/);
    assert.doesNotMatch(checklist, /สร้างร้าน BarberQ Pilot Test/);
  });

  it("env example uses CLIPPERQ_SETUP_EMAIL with no sample address", () => {
    const env = read(".env.example");
    assert.match(env, /^CLIPPERQ_SETUP_EMAIL=$/m);
    assert.doesNotMatch(env, /BARBERQX_SETUP_EMAIL_DOMAIN/);
    assert.doesNotMatch(env, /CLIPPERQ_SETUP_EMAIL=.+/);
  });

  it("does not hardcode a real setup email address", () => {
    const webhook = read("src/lib/line/webhook-url.ts");
    const route = read("src/app/api/[shop]/line-channel/route.ts");
    const linePage = read("src/app/admin/settings/line/page.tsx");
    for (const src of [webhook, route, linePage]) {
      assert.doesNotMatch(src, /@[a-z0-9.-]+\.(com|net|org)/i);
    }
  });
});
