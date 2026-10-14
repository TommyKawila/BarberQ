import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  NO_SHOW_WARNING_THRESHOLD,
  buildNoShowCountLookup,
  countCustomerNoShows,
  resolveNoShowCount,
} from "@/lib/admin/customer-no-show";
import type { Appointment } from "@/types/booking";

function noShow(partial: Partial<Appointment>): Appointment {
  return {
    id: partial.id ?? "a1",
    barber_id: "b1",
    customer_ref: null,
    customer_name: "C",
    customer_phone: partial.customer_phone ?? null,
    start_time: "2026-01-01T03:00:00.000Z",
    end_time: "2026-01-01T03:30:00.000Z",
    status: "no_show",
    created_at: "2026-01-01T02:00:00.000Z",
    customer_line_id: partial.customer_line_id ?? null,
    source: "line",
  };
}

describe("customer-no-show", () => {
  it("counts by line id or phone", () => {
    const rows = [
      noShow({ id: "1", customer_line_id: "U1", customer_phone: "0811111111" }),
      noShow({ id: "2", customer_line_id: "U1" }),
      noShow({ id: "3", customer_phone: "0822222222" }),
    ];
    assert.equal(countCustomerNoShows(rows, { customerLineId: "U1" }), 2);
    assert.equal(countCustomerNoShows(rows, { customerPhone: "0822222222" }), 1);
    assert.equal(countCustomerNoShows(rows, {}), 0);
  });

  it("resolve prefers line id over phone", () => {
    const lookup = buildNoShowCountLookup([
      noShow({ customer_line_id: "U1", customer_phone: "0811111111" }),
      noShow({ customer_phone: "0811111111" }),
    ]);
    assert.equal(
      resolveNoShowCount(lookup, { customerLineId: "U1", customerPhone: "0811111111" }),
      1,
    );
    assert.equal(resolveNoShowCount(lookup, { customerPhone: "0811111111" }), 2);
    assert.equal(NO_SHOW_WARNING_THRESHOLD, 2);
  });
});
