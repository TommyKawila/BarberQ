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

  it("only the pressed button shows busy spinner; sibling stays slight-dim", () => {
    assert.match(src, /Loader2/);
    assert.match(src, /animate-spin/);
    assert.match(src, /กำลังเริ่ม/);
    assert.match(src, /กำลังบันทึก/);
    assert.match(src, /busy\.action === "start"/);
    assert.match(src, /busy\.action === "left"/);
    assert.match(src, /actionButtonClass/);
    assert.match(src, /opacity-80/);
    assert.match(src, /opacity-100/);
    // Must not apply heavy disabled:opacity-50 to both buttons equally.
    assert.ok(
      !src.includes("disabled:opacity-50"),
      "disabled:opacity-50 dims both buttons the same — use pressed vs sibling opacity instead",
    );
  });
});
