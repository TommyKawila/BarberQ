import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shortBookingUrl } from "@/lib/admin/short-url";

describe("shortBookingUrl", () => {
  it("strips protocol and trailing slash", () => {
    assert.equal(shortBookingUrl("https://clipperq.app/phinxstudio/"), "clipperq.app/phinxstudio");
  });

  it("handles bare paths", () => {
    assert.equal(shortBookingUrl("/phinxstudio"), "/phinxstudio");
  });
});
