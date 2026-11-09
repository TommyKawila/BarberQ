import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { dictionary } from "@/lib/i18n/dictionary";
import { isEnglishEnabled } from "@/lib/i18n/feature-flag";
import { resolveLocale } from "@/lib/i18n/resolve-locale";

describe("isEnglishEnabled", () => {
  it("is on only for exact string true", () => {
    assert.equal(isEnglishEnabled("true"), true);
  });

  it("is off when unset", () => {
    assert.equal(isEnglishEnabled(undefined), false);
  });

  it("is off for any other value", () => {
    assert.equal(isEnglishEnabled("True"), false);
    assert.equal(isEnglishEnabled("TRUE"), false);
    assert.equal(isEnglishEnabled("1"), false);
    assert.equal(isEnglishEnabled("false"), false);
    assert.equal(isEnglishEnabled(" true"), false);
    assert.equal(isEnglishEnabled("true "), false);
    assert.equal(isEnglishEnabled(""), false);
  });
});

describe("resolveLocale", () => {
  it("flag unset/off → Thai even when storage holds en", () => {
    assert.equal(resolveLocale("en", false), "th");
    assert.equal(resolveLocale(null, false), "th");
  });

  it("flag true → switching works from stored value", () => {
    assert.equal(resolveLocale("en", true), "en");
    assert.equal(resolveLocale("th", true), "th");
    assert.equal(resolveLocale(null, true), "th");
    assert.equal(resolveLocale("garbage", true), "th");
  });

  it("does not require clearing stored en when English is off", () => {
    // Stored value is ignored for resolution; callers must not erase localStorage.
    assert.equal(resolveLocale("en", false), "th");
  });
});

describe("i18n dictionaries", () => {
  it("th and en have identical keys", () => {
    const thKeys = Object.keys(dictionary.th).sort();
    const enKeys = Object.keys(dictionary.en).sort();
    assert.deepEqual(thKeys, enKeys);
  });
});

describe("english feature flag wiring", () => {
  it("feature-flag.ts contains literal process.env.NEXT_PUBLIC_ENABLE_ENGLISH", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/lib/i18n/feature-flag.ts"),
      "utf8",
    );
    assert.ok(src.includes("process.env.NEXT_PUBLIC_ENABLE_ENGLISH"));
  });

  it("LanguageToggle returns null when English is disabled", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/components/layout/LanguageToggle.tsx"),
      "utf8",
    );
    assert.match(src, /isEnglishEnabled/);
    assert.match(src, /if \(!isEnglishEnabled\(\)\) return null/);
  });

  it("LocaleProvider resolves locale via resolveLocale", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/lib/i18n/locale-provider.tsx"),
      "utf8",
    );
    assert.match(src, /resolveLocale\(stored\)/);
    assert.doesNotMatch(src, /localStorage\.removeItem/);
  });

  it("site.webmanifest description is Thai", () => {
    const src = readFileSync(
      resolve(process.cwd(), "public/site.webmanifest"),
      "utf8",
    );
    assert.match(src, /ระบบจองคิวร้านตัดผมผ่าน LINE/);
  });
});
