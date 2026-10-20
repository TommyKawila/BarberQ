import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolveActiveSettingsSection,
  SETTINGS_SPY_HEADER_OFFSET_PX,
  SETTINGS_SPY_TOP_EPSILON_PX,
} from "@/lib/admin/settings-section-spy";

const IDS = ["shop-info", "shop-hours", "line-notify", "queue-pricing", "managers"] as const;

describe("resolveActiveSettingsSection", () => {
  it("pins first section when scrollTop is near 0", () => {
    // Even if a lower section's top is already above the marker (short first section),
    // top-of-page must stay on the first id.
    const tops = [40, 120, 200, 280, 360];
    assert.equal(
      resolveActiveSettingsSection({
        sectionIds: IDS,
        sectionTops: tops,
        scrollTop: 0,
      }),
      "shop-info",
    );
    assert.equal(
      resolveActiveSettingsSection({
        sectionIds: IDS,
        sectionTops: tops,
        scrollTop: SETTINGS_SPY_TOP_EPSILON_PX,
      }),
      "shop-info",
    );
  });

  it("selects the section whose top most recently crossed the header offset", () => {
    const tops = [0, 800, 1200, 1600, 2000];
    const header = SETTINGS_SPY_HEADER_OFFSET_PX;
    assert.equal(
      resolveActiveSettingsSection({
        sectionIds: IDS,
        sectionTops: tops,
        scrollTop: 100,
        headerOffset: header,
      }),
      "shop-info",
    );
    // marker = 750 + 72 = 822 → shop-hours (800) has crossed
    assert.equal(
      resolveActiveSettingsSection({
        sectionIds: IDS,
        sectionTops: tops,
        scrollTop: 750,
        headerOffset: header,
      }),
      "shop-hours",
    );
    // marker = 1150 + 72 = 1222 → line-notify
    assert.equal(
      resolveActiveSettingsSection({
        sectionIds: IDS,
        sectionTops: tops,
        scrollTop: 1150,
        headerOffset: header,
      }),
      "line-notify",
    );
  });

  it("handles a short first section taller/shorter than the viewport marker", () => {
    // Short shop-info ending before mid-viewport; hours starts early
    const tops = [0, 200, 900, 1400, 1800];
    assert.equal(
      resolveActiveSettingsSection({
        sectionIds: IDS,
        sectionTops: tops,
        scrollTop: 0,
      }),
      "shop-info",
    );
    assert.equal(
      resolveActiveSettingsSection({
        sectionIds: IDS,
        sectionTops: tops,
        scrollTop: 180,
        headerOffset: 72,
      }),
      "shop-hours",
    );
  });

  it("keeps last section when scrolled past all tops", () => {
    const tops = [0, 400, 800, 1200, 1600];
    assert.equal(
      resolveActiveSettingsSection({
        sectionIds: IDS,
        sectionTops: tops,
        scrollTop: 5000,
        headerOffset: 72,
      }),
      "managers",
    );
  });

  it("returns empty string for empty ids", () => {
    assert.equal(
      resolveActiveSettingsSection({ sectionIds: [], sectionTops: [], scrollTop: 0 }),
      "",
    );
  });
});
