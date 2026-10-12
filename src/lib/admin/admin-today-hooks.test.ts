import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("admin today page hooks order", () => {
  it("keeps freeNow/mini useMemo before auth early return", () => {
    const src = readFileSync(join(process.cwd(), "src/app/admin/page.tsx"), "utf8");
    const freeIdx = src.indexOf("const freeNow = useMemo");
    const miniIdx = src.indexOf("const mini = useMemo");
    // Component-level early return (not the useEffect guard).
    const earlyReturnIdx = src.indexOf("if (!ready || !profile) {\n    return (");
    assert.ok(freeIdx > 0, "freeNow useMemo present");
    assert.ok(miniIdx > 0, "mini useMemo present");
    assert.ok(earlyReturnIdx > 0, "auth early return present");
    assert.ok(
      freeIdx < earlyReturnIdx && miniIdx < earlyReturnIdx,
      "useMemo hooks must run before conditional auth return (Rules of Hooks)",
    );
  });
});
