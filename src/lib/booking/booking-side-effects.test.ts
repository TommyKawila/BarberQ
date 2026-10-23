import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runBookingSideEffect } from "./booking-side-effects";

describe("runBookingSideEffect", () => {
  it("returns side-effect result when it succeeds", async () => {
    const apt = { id: "a1" };
    const out = await runBookingSideEffect(apt, async () => ({
      id: "a1",
      reminder_due_at: "x",
    }));
    assert.deepEqual(out, { id: "a1", reminder_due_at: "x" });
  });

  it("returns the committed appointment when a post-insert side effect throws (prod false failure)", async () => {
    const apt = { id: "55352edd-202c-4e7e-ba6b-6cbb5089d52e", status: "confirmed" };
    const out = await runBookingSideEffect(
      apt,
      async () => {
        throw new Error(
          "Could not find the 'source' column of 'appointments' in the schema cache",
        );
      },
      { appointmentId: apt.id, event: "booking_post_insert_side_effect_error" },
    );
    assert.equal(out, apt);
    assert.equal(out.status, "confirmed");
  });
});
