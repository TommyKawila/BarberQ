import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  appointmentPatchWithoutSource,
  isMissingColumnError,
  nextAppointmentCreatePatch,
} from "./appointment-create-patch";

describe("appointment-create-patch", () => {
  it("detects missing source column (Postgres 42703 / PostgREST PGRST204)", () => {
    assert.equal(
      isMissingColumnError(
        { code: "PGRST204", message: "Could not find the 'source' column of 'appointments' in the schema cache" },
        "source",
      ),
      true,
    );
    assert.equal(
      isMissingColumnError({ code: "42703", message: 'column "source" of relation "appointments" does not exist' }, "source"),
      true,
    );
    assert.equal(
      isMissingColumnError({ code: "42501", message: "permission denied" }, "source"),
      false,
    );
  });

  it("retries without source when migration 0026 is missing (prod false-failure)", () => {
    const patch = {
      source: "line",
      end_time: "2026-10-23T13:00:00.000Z",
      customer_ref: "U123",
      customer_phone: "0897553362",
    };
    const next = nextAppointmentCreatePatch(patch, {
      code: "PGRST204",
      message: "Could not find the 'source' column of 'appointments' in the schema cache",
    });
    assert.deepEqual(next, {
      end_time: "2026-10-23T13:00:00.000Z",
      customer_ref: "U123",
      customer_phone: "0897553362",
    });
    assert.equal("source" in (next ?? {}), false);
    assert.deepEqual(appointmentPatchWithoutSource(patch), next);
  });

  it("does not retry when error is unrelated to source", () => {
    assert.equal(
      nextAppointmentCreatePatch(
        { source: "line", end_time: "2026-10-23T13:00:00.000Z" },
        { code: "42501", message: "permission denied for table appointments" },
      ),
      null,
    );
  });
});
