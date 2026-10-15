import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(
  join(process.cwd(), "src/components/admin/QrWaitingBoard.tsx"),
  "utf8",
);

describe("QrWaitingBoard start/error UX", () => {
  it("shows per-entry alert under the row (not a panel-footer only error)", () => {
    assert.match(src, /alertById/);
    assert.match(src, /role="alert"/);
    assert.match(src, /data-qr-alert="error"/);
    assert.match(src, /data-qr-alert="shorten"/);
    // No orphan footer error for the start flow.
    assert.ok(
      !src.includes('{error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}'),
      "must not render a tiny panel-footer error for start failures",
    );
  });

  it("uses prominent error/shorten styling with icons", () => {
    assert.match(src, /AlertCircle/);
    assert.match(src, /AlertTriangle/);
    assert.match(src, /border-red-500\/60/);
    assert.match(src, /border-amber-500\/60/);
    assert.match(src, /text-sm font-semibold/);
  });

  it("shows loading spinner and disables เริ่มตัด while the request runs", () => {
    assert.match(src, /Loader2/);
    assert.match(src, /animate-spin/);
    assert.match(src, /กำลังเริ่ม/);
    assert.match(src, /aria-busy=\{rowBusy\}/);
    assert.match(src, /disabled=\{busyId !== null\}/);
  });
});
