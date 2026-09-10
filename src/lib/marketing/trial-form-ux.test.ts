import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  firstInvalidTrialField,
  getTrialFormFieldErrors,
} from "@/lib/marketing/trial-form-ux";

const valid = {
  shopName: "PHINX",
  contactName: "Somchai",
  contactValue: "0891234567",
  barberCount: "",
};

describe("trial form client validation", () => {
  it("flags empty required fields", () => {
    const errors = getTrialFormFieldErrors({
      shopName: "  ",
      contactName: "",
      contactValue: "",
      barberCount: "",
    });
    assert.deepEqual(errors, {
      shopName: true,
      contactName: true,
      contactValue: true,
    });
    assert.equal(firstInvalidTrialField(errors), "shopName");
  });

  it("accepts empty optional barber count", () => {
    const errors = getTrialFormFieldErrors(valid);
    assert.deepEqual(errors, {});
    assert.equal(firstInvalidTrialField(errors), null);
  });

  it("rejects invalid barber count", () => {
    const errors = getTrialFormFieldErrors({ ...valid, barberCount: "0" });
    assert.equal(errors.barberCount, true);
    assert.equal(firstInvalidTrialField(errors), "barberCount");
  });

  it("accepts barber count 1-100", () => {
    assert.deepEqual(getTrialFormFieldErrors({ ...valid, barberCount: "10" }), {});
  });
});
