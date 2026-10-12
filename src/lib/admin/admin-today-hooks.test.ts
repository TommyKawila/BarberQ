import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { Window } from "happy-dom";
import { useAdminTodayDerived } from "@/lib/admin/use-admin-today-derived";
import type { AdminColumn } from "@/types/booking";

const SAMPLE_COLUMNS: AdminColumn[] = [
  {
    barber: {
      id: "b1",
      name: "A",
      slot_duration_minutes: 30,
      off_days: [],
      created_at: "2026-10-12T00:00:00.000Z",
    },
    slots: [
      {
        startTime: "2026-10-12T05:00:00.000Z",
        endTime: "2026-10-12T05:30:00.000Z",
        available: true,
        kind: "free",
      },
      {
        startTime: "2026-10-12T04:00:00.000Z",
        endTime: "2026-10-12T04:30:00.000Z",
        available: false,
        kind: "booked",
        status: "completed",
      },
    ],
  },
];

describe("admin today page hooks order (source)", () => {
  it("calls useAdminTodayDerived before auth early return", () => {
    const src = readFileSync(join(process.cwd(), "src/app/admin/page.tsx"), "utf8");
    const derivedIdx = src.indexOf("useAdminTodayDerived(");
    const earlyReturnIdx = src.indexOf("if (!ready || !profile) {\n    return (");
    assert.ok(derivedIdx > 0, "useAdminTodayDerived present");
    assert.ok(earlyReturnIdx > 0, "auth early return present");
    assert.ok(
      derivedIdx < earlyReturnIdx,
      "useAdminTodayDerived must run before conditional auth return (Rules of Hooks / React #310)",
    );
    assert.ok(
      !src.includes("const freeNow = useMemo"),
      "freeNow useMemo must live inside useAdminTodayDerived, not in the page body after returns",
    );
  });
});

describe("useAdminTodayDerived loading→loaded render", () => {
  let happyWindow: Window;
  // happy-dom element types are not identical to lib.dom HTMLElement
  let container: { querySelector: (s: string) => { textContent: string | null } | null };
  let root: Root;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    happyWindow = new Window({ url: "https://example.test/" });
    const { document } = happyWindow;
    Object.assign(globalThis, {
      window: happyWindow,
      document,
      HTMLElement: happyWindow.HTMLElement,
      Node: happyWindow.Node,
      TextEncoder,
      TextDecoder,
    });
    const el = document.createElement("div");
    document.body.appendChild(el);
    container = el;
    root = createRoot(el as unknown as Element);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    happyWindow.close();
  });

  it("survives loading→loaded without React #310", () => {
    function Harness({ ready }: { ready: boolean }) {
      // Always call derived hooks (correct pattern — mirrors AdminPage)
      const derived = useAdminTodayDerived(SAMPLE_COLUMNS, true, null);
      if (!ready) {
        return createElement("p", { "data-testid": "loading" }, "loading");
      }
      return createElement(
        "div",
        { "data-testid": "loaded" },
        `free=${derived.freeNow.length};done=${derived.mini.done}`,
      ) as ReactNode;
    }

    assert.doesNotThrow(() => {
      act(() => {
        root.render(createElement(Harness, { ready: false }));
      });
    });
    assert.equal(container.querySelector("[data-testid=loading]")?.textContent, "loading");

    assert.doesNotThrow(() => {
      act(() => {
        root.render(createElement(Harness, { ready: true }));
      });
    });
    const loaded = container.querySelector("[data-testid=loaded]");
    assert.ok(loaded, "loaded UI renders after ready");
    assert.match(loaded!.textContent ?? "", /free=\d+;done=1/);
  });
});
