"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import {
  BarChart3,
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
  booking: "admin.nav.booking",
  more: "admin.nav.more",
};

const MORE_HINTS: Partial<Record<AdminNavDestinationId, MessageKey>> = {
  schedule: "admin.moreScheduleHint",
  settings: "admin.moreSettingsHint",
  booking: "admin.moreBookingHint",
};

const ICON = { size: 20, strokeWidth: 2 } as const;

function NavIcon({ id }: { id: AdminNavItemId }) {
  if (id === "board") return <CalendarDays size={ICON.size} strokeWidth={ICON.strokeWidth} />;
  if (id === "team") return <Users size={ICON.size} strokeWidth={ICON.strokeWidth} />;
  if (id === "stats") return <BarChart3 size={ICON.size} strokeWidth={ICON.strokeWidth} />;
  if (id === "schedule") return <Clock3 size={ICON.size} strokeWidth={ICON.strokeWidth} />;
  if (id === "settings") return <Store size={ICON.size} strokeWidth={ICON.strokeWidth} />;
  if (id === "booking") return <ExternalLink size={ICON.size} strokeWidth={ICON.strokeWidth} />;
  return <MoreHorizontal size={ICON.size} strokeWidth={ICON.strokeWidth} />;
}

export function AdminNav({ role }: { role: ShopStaffRole }) {
  const { t } = useI18n();
  const { shopPath } = useShopSlug();
  const pathname = usePathname();
  const router = useRouter();
  const items = primaryAdminNavItems(role);
  const moreItems = moreAdminNavItems(role);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const subtitleId = useId();

  const hrefs = {
    board: shopPath(ADMIN_NAV_PATHS.board),
    team: shopPath(ADMIN_NAV_PATHS.team),
    schedule: shopPath(ADMIN_NAV_PATHS.schedule),
    stats: shopPath(ADMIN_NAV_PATHS.stats),
    settings: shopPath(ADMIN_NAV_PATHS.settings),
    booking: shopPath(ADMIN_NAV_PATHS.booking),
  };

  function closeMore() {
    setMoreOpen(false);
    window.requestAnimationFrame(() => moreButtonRef.current?.focus());
  }

  useEffect(() => {
    if (!moreOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    window.requestAnimationFrame(() => focusables()[0]?.focus());

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMore();
        return;
      }
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
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  return (
    <>
      {moreOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label={t("admin.close")}
            onClick={closeMore}
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={subtitleId}
            className={`absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-zinc-800 bg-zinc-950 px-4 pt-3 ${ADMIN_NAV_BAR_PADDING_CLASS}`}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-700" />
            <h2 id={titleId} className="text-base font-semibold">
              {t("admin.moreMenuTitle")}
            </h2>
            <p id={subtitleId} className="mt-1 text-sm text-zinc-400">
              {t("admin.moreMenuSubtitle")}
            </p>
            <div className="mt-4 flex flex-col gap-2 pb-3">
              {moreItems.map((item) => {
                const href = hrefs[item];
                const hintKey = MORE_HINTS[item];
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      closeMore();
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
              })}
              <button
                type="button"
                onClick={closeMore}
                className="mt-1 min-h-11 rounded-xl border border-zinc-700 text-sm text-zinc-200"
              >
                {t("admin.close")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <nav
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur ${ADMIN_NAV_BAR_PADDING_CLASS}`}
        aria-label={t("admin.nav.label")}
      >
        <div className="mx-auto flex h-16 max-w-lg items-stretch">
          {items.map((item) => {
            const active = isPrimaryNavActive(item, pathname, hrefs, moreOpen, moreItems);
            const className = `flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl mx-1 my-1.5 px-1 text-[11px] font-medium leading-tight ${
              active ? "bg-amber-400 text-zinc-950" : "bg-transparent text-zinc-400"
            }`;
            if (item === "more") {
              return (
                <button
                  key={item}
                  ref={moreButtonRef}
                  type="button"
                  aria-expanded={moreOpen}
                  aria-haspopup="dialog"
                  aria-label={t("admin.nav.more")}
                  onClick={() => setMoreOpen(true)}
                  className={className}
                >
                  <NavIcon id={item} />
                  <span>{t(NAV_LABELS[item])}</span>
                </button>
              );
            }
            const href = hrefs[item as AdminNavDestinationId];
            return (
              <Link key={item} href={href} className={className} aria-current={active ? "page" : undefined}>
                <NavIcon id={item} />
                <span>{t(NAV_LABELS[item])}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
