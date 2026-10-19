"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronRight,
  Clock3,
  ExternalLink,
  MoreHorizontal,
  Store,
  Users,
} from "lucide-react";
import type { ShopStaffRole } from "@/lib/admin-auth";
import {
  ADMIN_NAV_BAR_PADDING_CLASS,
  ADMIN_NAV_PATHS,
  isMoreDestinationPath,
  isPrimaryNavActive,
  moreAdminNavItems,
  primaryAdminNavItems,
  type AdminNavDestinationId,
  type AdminNavItemId,
} from "@/lib/admin/admin-nav-items";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/dictionary";
import { useShopSlug } from "@/lib/shop/shop-slug-context";

const NAV_LABELS: Record<AdminNavItemId, MessageKey> = {
  board: "admin.nav.board",
  team: "admin.nav.team",
  schedule: "admin.nav.schedule",
  stats: "admin.nav.stats",
  settings: "admin.nav.settings",
  notifications: "admin.settingsNotifications",
  booking: "admin.nav.booking",
  more: "admin.nav.more",
};

const MORE_HINTS: Partial<Record<AdminNavDestinationId, MessageKey>> = {
  schedule: "admin.moreScheduleHint",
  settings: "admin.moreSettingsHint",
  notifications: "admin.settingsNotificationsHint",
  booking: "admin.moreBookingHint",
};

const ICON = { size: 20, strokeWidth: 2 } as const;

function NavIcon({ id }: { id: AdminNavItemId }) {
  if (id === "board") return <CalendarDays size={ICON.size} strokeWidth={ICON.strokeWidth} />;
  if (id === "team") return <Users size={ICON.size} strokeWidth={ICON.strokeWidth} />;
  if (id === "stats") return <BarChart3 size={ICON.size} strokeWidth={ICON.strokeWidth} />;
  if (id === "schedule") return <Clock3 size={ICON.size} strokeWidth={ICON.strokeWidth} />;
  if (id === "settings") return <Store size={ICON.size} strokeWidth={ICON.strokeWidth} />;
  if (id === "notifications") return <Bell size={ICON.size} strokeWidth={ICON.strokeWidth} />;
  if (id === "booking") return <ExternalLink size={ICON.size} strokeWidth={ICON.strokeWidth} />;
  return <MoreHorizontal size={ICON.size} strokeWidth={ICON.strokeWidth} />;
}

function navItemClass(active: boolean, side: boolean) {
  if (side) {
    return `flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium ${
      active
        ? "bg-zinc-800 text-amber-400"
        : "bg-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
    }`;
  }
  return `flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl mx-1 my-1.5 px-1 text-xs font-medium leading-tight ${
    active ? "bg-zinc-800 text-amber-400" : "bg-transparent text-zinc-400"
  }`;
}

export function AdminNav({ role }: { role: ShopStaffRole }) {
  const { t } = useI18n();
  const { shopPath } = useShopSlug();
  const pathname = usePathname();
  const router = useRouter();
  const items = primaryAdminNavItems(role);
  const moreItems = moreAdminNavItems(role);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreButtonMobileRef = useRef<HTMLButtonElement>(null);
  const moreButtonSideRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const railMoreRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const subtitleId = useId();

  const hrefs = {
    board: shopPath(ADMIN_NAV_PATHS.board),
    team: shopPath(ADMIN_NAV_PATHS.team),
    schedule: shopPath(ADMIN_NAV_PATHS.schedule),
    stats: shopPath(ADMIN_NAV_PATHS.stats),
    settings: shopPath(ADMIN_NAV_PATHS.settings),
    notifications: shopPath(ADMIN_NAV_PATHS.notifications),
    booking: shopPath(ADMIN_NAV_PATHS.booking),
  };

  function closeMore(returnFocus: "mobile" | "side" | "auto" = "auto") {
    setMoreOpen(false);
    window.requestAnimationFrame(() => {
      if (returnFocus === "side" || (returnFocus === "auto" && moreButtonSideRef.current)) {
        (moreButtonSideRef.current ?? moreButtonMobileRef.current)?.focus();
        return;
      }
      (moreButtonMobileRef.current ?? moreButtonSideRef.current)?.focus();
    });
  }

  useEffect(() => {
    if (!moreOpen) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMore("auto");
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  // Mobile sheet: body lock + focus trap
  useEffect(() => {
    if (!moreOpen) return;
    // Only trap when the mobile sheet is in the DOM (lg:hidden sheet)
    const sheet = sheetRef.current;
    if (!sheet || window.matchMedia("(min-width: 1024px)").matches) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () =>
      Array.from(
        sheet.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
    window.requestAnimationFrame(() => focusables()[0]?.focus());

    function onTab(event: KeyboardEvent) {
      if (event.key !== "Tab") return;
      const nodes = focusables();
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onTab);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onTab);
    };
  }, [moreOpen]);

  // Side rail expand: move focus into the group
  useEffect(() => {
    if (!moreOpen) return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    window.requestAnimationFrame(() => {
      const first = railMoreRef.current?.querySelector<HTMLElement>("a[href], button");
      first?.focus();
    });
  }, [moreOpen]);

  function renderPrimaryItems(side: boolean) {
    return items.map((item) => {
      const active = isPrimaryNavActive(item, pathname, hrefs, moreOpen, moreItems);
      const className = navItemClass(active, side);
      if (item === "more") {
        return (
          <button
            key={item}
            ref={side ? moreButtonSideRef : moreButtonMobileRef}
            type="button"
            aria-expanded={moreOpen}
            aria-haspopup={side ? "true" : "dialog"}
            aria-controls={side ? "admin-more-rail" : titleId}
            aria-label={t("admin.nav.more")}
            onClick={() => setMoreOpen((open) => !open)}
            className={className}
          >
            <NavIcon id={item} />
            <span>{t(NAV_LABELS[item])}</span>
          </button>
        );
      }
      const href = hrefs[item as AdminNavDestinationId];
      const labelKey =
        item === "stats" && role === "barber" ? "admin.statsMySummary" : NAV_LABELS[item];
      return (
        <Link key={item} href={href} className={className} aria-current={active ? "page" : undefined}>
          <NavIcon id={item} />
          <span>{t(labelKey)}</span>
        </Link>
      );
    });
  }

  function renderMoreLinks(compact: boolean) {
    return moreItems.map((item) => {
      const href = hrefs[item];
      const hintKey = MORE_HINTS[item];
      const active = isMoreDestinationPath(pathname, item, hrefs);
      if (compact) {
        return (
          <Link
            key={item}
            href={href}
            onClick={() => closeMore("side")}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm ${
              active ? "bg-zinc-800 text-amber-400" : "text-zinc-300 hover:bg-zinc-900"
            }`}
          >
            <span className="text-amber-400/90">
              <NavIcon id={item} />
            </span>
            <span className="min-w-0 truncate">{t(NAV_LABELS[item])}</span>
          </Link>
        );
      }
      return (
        <button
          key={item}
          type="button"
          onClick={() => {
            closeMore("mobile");
            router.push(href);
          }}
          className="flex min-h-14 items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-left"
        >
          <span className="text-amber-400">
            <NavIcon id={item} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">{t(NAV_LABELS[item])}</span>
            {hintKey ? (
              <span className="mt-0.5 block text-xs text-zinc-400">{t(hintKey)}</span>
            ) : null}
          </span>
          <ChevronRight size={18} className="shrink-0 text-zinc-500" />
        </button>
      );
    });
  }

  return (
    <>
      {/* Mobile / tablet bottom sheet only (< lg) */}
      {moreOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label={t("admin.close")}
            onClick={() => closeMore("mobile")}
          />
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={subtitleId}
            className={`absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-zinc-800 bg-zinc-950 px-4 pt-3 md:mx-auto md:max-w-[640px] ${ADMIN_NAV_BAR_PADDING_CLASS}`}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-700" />
            <h2 id={titleId} className="font-heading text-base font-semibold">
              {t("admin.moreMenuTitle")}
            </h2>
            <p id={subtitleId} className="mt-1 text-sm text-zinc-400">
              {t("admin.moreMenuSubtitle")}
            </p>
            <div className="mt-4 flex flex-col gap-2 pb-3">
              {renderMoreLinks(false)}
              <button
                type="button"
                onClick={() => closeMore("mobile")}
                className="mt-1 min-h-11 rounded-xl border border-zinc-700 text-sm text-zinc-200"
              >
                {t("admin.close")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Desktop side rail (≥ lg / iPad landscape+) */}
      <aside
        className="sticky top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 px-3 py-4 lg:flex"
        aria-label={t("admin.nav.label")}
      >
        <nav className="flex flex-col gap-1">{renderPrimaryItems(true)}</nav>
        {moreOpen ? (
          <div
            id="admin-more-rail"
            ref={railMoreRef}
            className="mt-3 border-t border-zinc-800 pt-3"
            role="group"
            aria-label={t("admin.moreMenuTitle")}
          >
            <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              {t("admin.nav.more")}
            </p>
            <div className="flex flex-col gap-0.5">{renderMoreLinks(true)}</div>
          </div>
        ) : null}
      </aside>

      {/* Mobile / tablet bottom nav */}
      <nav
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur lg:hidden ${ADMIN_NAV_BAR_PADDING_CLASS}`}
        aria-label={t("admin.nav.label")}
      >
        <div className="mx-auto flex h-16 max-w-lg items-stretch md:max-w-[640px]">
          {renderPrimaryItems(false)}
        </div>
      </nav>
    </>
  );
}
