import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");

describe("marketing layout split", () => {
  it("root layout has no max-w-lg", () => {
    const layout = readFileSync(resolve(root, "app/layout.tsx"), "utf8");
    assert.doesNotMatch(layout, /max-w-lg/);
  });

  it("shop layout keeps max-w-lg via PhoneShell", () => {
    const layout = readFileSync(resolve(root, "app/[shop]/layout.tsx"), "utf8");
    assert.match(layout, /PhoneShell/);
  });

  it("app group layout keeps PhoneShell", () => {
    const layout = readFileSync(resolve(root, "app/(app)/layout.tsx"), "utf8");
    assert.match(layout, /PhoneShell/);
  });

  it("operator layout is full width without PhoneShell", () => {
    const layout = readFileSync(resolve(root, "app/(operator)/layout.tsx"), "utf8");
    assert.doesNotMatch(layout, /PhoneShell/);
    assert.doesNotMatch(layout, /max-w-lg/);
  });

  it("superadmin pages live in operator group", () => {
    const shops = readFileSync(resolve(root, "app/(operator)/superadmin/page.tsx"), "utf8");
    const page = readFileSync(
      resolve(root, "app/(operator)/superadmin/trial-leads/page.tsx"),
      "utf8",
    );
    assert.match(shops, /superadmin/);
    assert.match(page, /TrialLeadsCrm/);
  });

  it("sales page CTAs use the shared trial destination builder", () => {
    const sales = readFileSync(
      resolve(root, "components/marketing/SalesPage.tsx"),
      "utf8",
    );
    const nav = readFileSync(
      resolve(root, "components/marketing/MarketingNav.tsx"),
      "utf8",
    );
    assert.match(sales, /MarketingTrialLink/);
    assert.match(nav, /MarketingTrialLink/);
    assert.doesNotMatch(sales, /href="\/trial"/);
    assert.doesNotMatch(nav, /href="\/trial"/);
    assert.doesNotMatch(sales, /variant="trial"/);
  });

  it("trial page uses focused chrome without sales nav CTA", () => {
    const trial = readFileSync(
      resolve(root, "components/marketing/TrialForm.tsx"),
      "utf8",
    );
    const nav = readFileSync(
      resolve(root, "components/marketing/MarketingNav.tsx"),
      "utf8",
    );
    assert.match(trial, /variant="trial"/);
    assert.match(trial, /noValidate/);
    assert.match(trial, /marketing.trial.backHome/);
    assert.doesNotMatch(trial, /← Home/);
    assert.match(nav, /variant === "trial"/);
  });
});
