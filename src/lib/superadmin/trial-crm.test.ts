import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { memoryStore } from "@/lib/data/memory-store";
import { GET as publicGet } from "@/app/api/trial-leads/route";
import {
  GET as adminGet,
  PATCH as adminPatch,
} from "@/app/api/superadmin/trial-leads/route";
import {
  GET as notesGet,
  POST as notesPost,
} from "@/app/api/superadmin/trial-leads/[id]/notes/route";
import { MAX_TRIAL_LEAD_NOTE } from "@/lib/marketing/trial-leads";
import { isPhoneContact, lineUrl, telHref } from "@/lib/superadmin/trial-crm/contact";
import {
  applyTrialCrmView,
  computeTrialLeadStats,
  filterTrialLeads,
  sortTrialLeads,
} from "@/lib/superadmin/trial-crm/filters";
import { isFollowUpDueToday, parseFollowUpAt } from "@/lib/superadmin/trial-crm/follow-up";
import { validateNoteBody } from "@/lib/superadmin/trial-crm/notes";
import { TRIAL_CRM_STATUS_KEYS } from "@/lib/superadmin/trial-crm/status";
import type { TrialLead } from "@/lib/marketing/trial-leads";

const root = resolve(import.meta.dirname, "../..");

function lead(partial: Partial<TrialLead> & Pick<TrialLead, "id" | "shop_name">): TrialLead {
  return {
    contact_name: "Ann",
    contact_value: "0891111111",
    province: null,
    barber_count: null,
    status: "NEW",
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    referrer: null,
    locale: "th",
    follow_up_at: null,
    created_at: "2026-09-10T10:00:00.000Z",
    updated_at: "2026-09-10T10:00:00.000Z",
    ...partial,
  };
}

describe("trial CRM helpers", () => {
  it("maps status labels", () => {
    assert.equal(TRIAL_CRM_STATUS_KEYS.NEW, "superadmin.crm.status.new");
    assert.equal(TRIAL_CRM_STATUS_KEYS.CLOSED, "superadmin.crm.status.closed");
  });

  it("counts follow-up today and overdue, excluding converted/closed", () => {
    const now = new Date("2026-09-11T08:00:00");
    const leads = [
      lead({ id: "1", shop_name: "A", status: "NEW", follow_up_at: "2026-09-11T09:00:00.000Z" }),
      lead({ id: "2", shop_name: "B", status: "CONTACTED", follow_up_at: "2026-09-10T09:00:00.000Z" }),
      lead({ id: "3", shop_name: "C", status: "CONVERTED", follow_up_at: "2026-09-11T09:00:00.000Z" }),
      lead({ id: "4", shop_name: "D", status: "CLOSED", follow_up_at: "2026-09-10T09:00:00.000Z" }),
      lead({ id: "5", shop_name: "E", status: "NEW" }),
    ];
    assert.equal(isFollowUpDueToday(leads[0].follow_up_at, "NEW", now), true);
    assert.equal(isFollowUpDueToday(leads[1].follow_up_at, "CONTACTED", now), true);
    assert.equal(isFollowUpDueToday(leads[2].follow_up_at, "CONVERTED", now), false);
    assert.equal(computeTrialLeadStats(leads, now).followUpToday, 2);
    assert.equal(computeTrialLeadStats(leads, now).newCount, 2);
  });

  it("searches shop contact and value", () => {
    const leads = [
      lead({ id: "1", shop_name: "Tommy Barber", contact_name: "เทพทัต", contact_value: "0897553362" }),
      lead({ id: "2", shop_name: "Other", contact_name: "Ann", contact_value: "@lineid" }),
    ];
    assert.equal(filterTrialLeads(leads, { q: "tommy" }).length, 1);
    assert.equal(filterTrialLeads(leads, { q: "เทพ" }).length, 1);
    assert.equal(filterTrialLeads(leads, { q: "089755" }).length, 1);
  });

  it("filters status source and campaign together", () => {
    const leads = [
      lead({ id: "1", shop_name: "A", status: "NEW", utm_source: "facebook", utm_campaign: "beta" }),
      lead({ id: "2", shop_name: "B", status: "NEW", utm_source: "ig", utm_campaign: "beta" }),
      lead({ id: "3", shop_name: "C", status: "CONTACTED", utm_source: "facebook", utm_campaign: "beta" }),
    ];
    const out = filterTrialLeads(leads, {
      status: "NEW",
      source: "facebook",
      campaign: "beta",
    });
    assert.deepEqual(out.map((l) => l.id), ["1"]);
  });

  it("sorts newest oldest follow-up and barbers", () => {
    const leads = [
      lead({ id: "old", shop_name: "A", created_at: "2026-01-01T00:00:00.000Z", barber_count: 2 }),
      lead({
        id: "new",
        shop_name: "B",
        created_at: "2026-09-01T00:00:00.000Z",
        follow_up_at: "2026-09-20T00:00:00.000Z",
        barber_count: 9,
      }),
      lead({
        id: "soon",
        shop_name: "C",
        created_at: "2026-06-01T00:00:00.000Z",
        follow_up_at: "2026-09-12T00:00:00.000Z",
      }),
    ];
    assert.equal(sortTrialLeads(leads, "newest")[0].id, "new");
    assert.equal(sortTrialLeads(leads, "oldest")[0].id, "old");
    assert.equal(sortTrialLeads(leads, "followup")[0].id, "soon");
    assert.equal(sortTrialLeads(leads, "barbers")[0].id, "new");
    assert.equal(applyTrialCrmView(leads, { q: "C" }, "newest")[0].id, "soon");
  });

  it("parses follow-up and notes", () => {
    assert.equal(parseFollowUpAt(null), null);
    assert.match(parseFollowUpAt("2026-09-11T10:00:00.000Z") ?? "", /2026-09-11/);
    assert.throws(() => parseFollowUpAt("nope"), /INVALID_FOLLOW_UP/);
    assert.equal(validateNoteBody("  hello  "), "hello");
    assert.throws(() => validateNoteBody("  "), /INVALID_NOTE/);
    assert.throws(() => validateNoteBody("x".repeat(MAX_TRIAL_LEAD_NOTE + 1)), /NOTE_TOO_LONG/);
  });

  it("detects phone vs line url", () => {
    assert.equal(isPhoneContact("0897553362"), true);
    assert.equal(telHref("089-755-3362"), "tel:0897553362");
    assert.equal(isPhoneContact("@lineid"), false);
    assert.equal(lineUrl("https://line.me/R/ti/p/@shop"), "https://line.me/R/ti/p/@shop");
    assert.equal(lineUrl("@shop"), null);
  });
});

describe("trial CRM store and API", () => {
  it("rejects unauthorized list mutation and notes", async () => {
    process.env.SUPERADMIN_TOKEN = "secret";
    const list = await adminGet(new Request("http://localhost/api/superadmin/trial-leads"));
    assert.equal(list.status, 401);
    const patch = await adminPatch(
      new Request("http://localhost/api/superadmin/trial-leads", {
        method: "PATCH",
        body: JSON.stringify({ id: "x", status: "NEW" }),
      }),
    );
    assert.equal(patch.status, 401);
    const notes = await notesGet(new Request("http://localhost/api/superadmin/trial-leads/x/notes"), {
      params: Promise.resolve({ id: "x" }),
    });
    assert.equal(notes.status, 401);
  });

  it("super admin store can update follow-up and scoped notes", async () => {
    const created = await memoryStore.createTrialLead({
      shopName: "CRM Shop",
      contactName: "Owner",
      contactValue: "0811111111",
    });
    const contacted = await memoryStore.updateTrialLead(created.id, { status: "CONTACTED" });
    assert.equal(contacted.status, "CONTACTED");
    const followed = await memoryStore.updateTrialLead(created.id, {
      followUpAt: "2026-09-12T03:00:00.000Z",
    });
    assert.ok(followed.follow_up_at);
    const cleared = await memoryStore.updateTrialLead(created.id, { followUpAt: null });
    assert.equal(cleared.follow_up_at, null);
    await memoryStore.createTrialLeadNote(created.id, "called");
    const other = await memoryStore.createTrialLead({
      shopName: "Other",
      contactName: "B",
      contactValue: "2",
    });
    const notes = await memoryStore.listTrialLeadNotes(created.id);
    const otherNotes = await memoryStore.listTrialLeadNotes(other.id);
    assert.equal(notes.length, 1);
    assert.equal(notes[0].trial_lead_id, created.id);
    assert.equal(otherNotes.length, 0);
  });

  it("rejects invalid status follow-up and notes", async () => {
    process.env.SUPERADMIN_TOKEN = "secret";
    const created = await memoryStore.createTrialLead({
      shopName: "Bad",
      contactName: "A",
      contactValue: "1",
    });
    const headers = { "x-superadmin-token": "secret", "Content-Type": "application/json" };
    const badStatus = await adminPatch(
      new Request("http://localhost/api/superadmin/trial-leads", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ id: created.id, status: "WON" }),
      }),
    );
    assert.equal(badStatus.status, 400);
    const badFollow = await adminPatch(
      new Request("http://localhost/api/superadmin/trial-leads", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ id: created.id, followUpAt: "not-a-date" }),
      }),
    );
    assert.equal(badFollow.status, 400);
    const blank = await notesPost(
      new Request(`http://localhost/api/superadmin/trial-leads/${created.id}/notes`, {
        method: "POST",
        headers,
        body: JSON.stringify({ body: "   " }),
      }),
      { params: Promise.resolve({ id: created.id }) },
    );
    assert.equal(blank.status, 400);
    const huge = await notesPost(
      new Request(`http://localhost/api/superadmin/trial-leads/${created.id}/notes`, {
        method: "POST",
        headers,
        body: JSON.stringify({ body: "x".repeat(MAX_TRIAL_LEAD_NOTE + 1) }),
      }),
      { params: Promise.resolve({ id: created.id }) },
    );
    assert.equal(huge.status, 400);
  });

  it("public trial API never exposes notes", async () => {
    const get = await publicGet();
    assert.equal(get.status, 405);
    const sql = readFileSync(
      resolve(root, "../supabase/migrations/0024_trial_lead_crm.sql"),
      "utf8",
    );
    assert.match(sql, /ON DELETE CASCADE/i);
  });
});
