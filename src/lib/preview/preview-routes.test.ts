import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { arePreviewRoutesEnabled } from "@/lib/preview/preview-routes";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";

describe("arePreviewRoutesEnabled", () => {
  it("enables for founder_qa (barberq-qa)", () => {
    assert.equal(
      arePreviewRoutesEnabled({
        NODE_ENV: "production",
        BARBERQ_ENV: "founder_qa",
        NEXT_PUBLIC_APP_URL: "https://barberq-qa.vercel.app",
      }),
      true,
    );
  });

  it("enables for local BARBERQ_ENV", () => {
    assert.equal(
      arePreviewRoutesEnabled({
        NODE_ENV: "production",
        BARBERQ_ENV: "local",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      }),
      true,
    );
  });

  it("enables in non-production NODE_ENV when BARBERQ_ENV is unset", () => {
    assert.equal(
      arePreviewRoutesEnabled({
        NODE_ENV: "development",
      }),
      true,
    );
  });

  it("disables for production BARBERQ_ENV", () => {
    assert.equal(
      arePreviewRoutesEnabled({
        NODE_ENV: "production",
        BARBERQ_ENV: "production",
        NEXT_PUBLIC_APP_URL: "https://barber-q-pi.vercel.app",
      }),
      false,
    );
  });

  it("disables when APP_URL is a production hostname even if BARBERQ_ENV is missing", () => {
    assert.equal(
      arePreviewRoutesEnabled({
        NODE_ENV: "production",
        NEXT_PUBLIC_APP_URL: "https://barber-q-pi.vercel.app",
      }),
      false,
    );
  });

  it("ENABLE_PREVIEW_ROUTES=true forces on", () => {
    assert.equal(
      arePreviewRoutesEnabled({
        NODE_ENV: "production",
        BARBERQ_ENV: "production",
        NEXT_PUBLIC_APP_URL: "https://barber-q-pi.vercel.app",
        ENABLE_PREVIEW_ROUTES: "true",
      }),
      true,
    );
  });

  it("ENABLE_PREVIEW_ROUTES=false forces off", () => {
    assert.equal(
      arePreviewRoutesEnabled({
        NODE_ENV: "development",
        BARBERQ_ENV: "founder_qa",
        NEXT_PUBLIC_APP_URL: "https://barberq-qa.vercel.app",
        ENABLE_PREVIEW_ROUTES: "false",
      }),
      false,
    );
  });
});

describe("preview routes SEO", () => {
  it("robots.txt disallows /preview/", () => {
    const rules = robots().rules;
    const rule = Array.isArray(rules) ? rules[0] : rules;
    const disallow = rule?.disallow;
    const list = Array.isArray(disallow) ? disallow : [disallow];
    assert.ok(list.some((d) => typeof d === "string" && d.includes("/preview")));
  });

  it("sitemap never lists /preview paths", () => {
    const entries = sitemap();
    for (const entry of entries) {
      assert.doesNotMatch(entry.url, /\/preview(\/|$)/);
    }
  });

  it("preview layout calls the gate + notFound", () => {
    const layout = readFileSync(
      resolve(process.cwd(), "src/app/preview/layout.tsx"),
      "utf8",
    );
    assert.match(layout, /arePreviewRoutesEnabled/);
    assert.match(layout, /notFound/);
  });

  it("hero anim uses static hero-screens assets, not /preview routes", () => {
    const anim = readFileSync(
      resolve(process.cwd(), "src/components/marketing/mockups/HeroLineBookingAnim.tsx"),
      "utf8",
    );
    assert.match(anim, /\/sale\/hero-screens\//);
    assert.doesNotMatch(anim, /\/preview\//);
  });
});
