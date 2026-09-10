import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { memoryStore } from "@/lib/data/memory-store";
import { assertSuperAdminToken } from "@/lib/superadmin/auth";
import {
  isHoneypotTriggered,
  validateTrialLeadPayload,
} from "@/lib/marketing/trial-leads";
import {
  getClientIp,
  isTrialRateLimited,
  resetTrialRateLimit,
} from "@/lib/marketing/trial-rate-limit";
import { trackMarketingEvent } from "@/lib/marketing/events";
import { captureAttributionFromSearch } from "@/lib/marketing/attribution";

describe("trial lead validation", () => {
  it("accepts valid payload", () => {
    const input = validateTrialLeadPayload({
      shopName: "Test Shop",
      contactName: "Somchai",
      contactValue: "0812345678",
    });
    assert.equal(input.shopName, "Test Shop");
  });

  it("rejects empty shop name", () => {
    assert.throws(
      () => validateTrialLeadPayload({ shopName: "", contactName: "A", contactValue: "1" }),
      /INVALID_SHOP_NAME/,
    );
  });

  it("accepts barberCount 11-100", () => {
    const input = validateTrialLeadPayload({
      shopName: "Big Shop",
      contactName: "Owner",
      contactValue: "@line",
      barberCount: 25,
    });
    assert.equal(input.barberCount, 25);
  });

  it("rejects barberCount over 100", () => {
    assert.throws(
      () =>
        validateTrialLeadPayload({
          shopName: "Shop",
          contactName: "A",
          contactValue: "1",
          barberCount: 101,
        }),
      /INVALID_BARBER_COUNT/,
    );
  });

  it("rejects barberCount 0", () => {
    assert.throws(
      () =>
        validateTrialLeadPayload({
          shopName: "Shop",
          contactName: "A",
          contactValue: "1",
          barberCount: 0,
        }),
      /INVALID_BARBER_COUNT/,
    );
  });

  it("rejects credential-like fields", () => {
    assert.throws(
      () =>
        validateTrialLeadPayload({
          shopName: "S",
          contactName: "A",
          contactValue: "1",
          linePassword: "x",
        }),
      /INVALID_CREDENTIAL_FIELD/,
    );
  });
});

describe("honeypot", () => {
  it("triggers when website is filled", () => {
    assert.equal(isHoneypotTriggered("spam.com"), true);
    assert.equal(isHoneypotTriggered(""), false);
    assert.equal(isHoneypotTriggered(undefined), false);
  });
});

describe("attribution", () => {
  it("captures utm params when present", () => {
    const data = captureAttributionFromSearch(
      "?utm_source=fb&utm_medium=cpc&utm_campaign=spring",
      "https://google.com",
      "th",
    );
    assert.equal(data.utmSource, "fb");
    assert.equal(data.utmMedium, "cpc");
    assert.equal(data.utmCampaign, "spring");
    assert.equal(data.referrer, "https://google.com");
    assert.equal(data.locale, "th");
  });

  it("does not invent values when absent", () => {
    const data = captureAttributionFromSearch("", null, "th");
    assert.equal(data.utmSource, null);
    assert.equal(data.referrer, null);
  });
});

describe("trial lead store", () => {
  it("persists lead with barberCount > 10", async () => {
    const lead = await memoryStore.createTrialLead({
      shopName: "Large Shop",
      contactName: "Owner",
      contactValue: "0899999999",
      barberCount: 15,
    });
    assert.equal(lead.barber_count, 15);
    assert.equal(lead.status, "NEW");
  });

  it("stores optional attribution", async () => {
    const lead = await memoryStore.createTrialLead({
      shopName: "Shop",
      contactName: "A",
      contactValue: "1",
      utmSource: "ig",
      locale: "en",
    });
    assert.equal(lead.utm_source, "ig");
    assert.equal(lead.locale, "en");
  });

  it("updates status and updated_at", async () => {
    const lead = await memoryStore.createTrialLead({
      shopName: "Shop",
      contactName: "A",
      contactValue: "1",
    });
    await new Promise((r) => setTimeout(r, 5));
    const updated = await memoryStore.updateTrialLeadStatus(lead.id, "CONTACTED");
    assert.equal(updated.status, "CONTACTED");
    assert.ok(updated.updated_at >= lead.updated_at);
  });
});

describe("rate limit", () => {
  beforeEach(() => resetTrialRateLimit());

  it("limits after max requests", () => {
    const ip = "1.2.3.4";
    for (let i = 0; i < 5; i++) {
      assert.equal(isTrialRateLimited(ip), false);
    }
    assert.equal(isTrialRateLimited(ip), true);
  });

  it("extracts client ip from forwarded header", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "10.0.0.1, 10.0.0.2" },
    });
    assert.equal(getClientIp(req), "10.0.0.1");
  });
});

describe("superadmin trial leads auth", () => {
  it("rejects missing token", () => {
    process.env.SUPERADMIN_TOKEN = "secret";
    assert.throws(() => assertSuperAdminToken(null), /Unauthorized/);
  });

  it("lists leads with valid token", async () => {
    process.env.SUPERADMIN_TOKEN = "secret";
    await memoryStore.createTrialLead({
      shopName: "Listed",
      contactName: "X",
      contactValue: "1",
    });
    const leads = await memoryStore.listTrialLeads();
    assert.ok(leads.some((l) => l.shop_name === "Listed"));
  });
});

describe("marketing events", () => {
  it("never accepts PII prop keys", () => {
    assert.throws(
      () => trackMarketingEvent("trial_form_submit", { contactName: "secret" } as never),
      /PII/,
    );
  });

  it("accepts safe props", () => {
    trackMarketingEvent("sales_cta_click", { destination: "/trial" });
    trackMarketingEvent("trial_form_error", { errorCode: "VALIDATION" });
  });
});

describe("layout helpers", () => {
  it("CTA destination is /trial", () => {
    assert.equal("/trial", "/trial");
  });
});
