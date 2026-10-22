"use client";

import { useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";
import { HelpCircle, MessageCircle, Sparkles, Wrench, X } from "lucide-react";
import Link from "next/link";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import { resolveClipperqSupportLineUrl } from "@/lib/marketing/clipperq-oa";
import { SUPPORT_REPLY_SLA_COPY_TH } from "@/lib/support/types";

/**
 * Floating help button (bottom-right). Hidden when a sticky save bar is present
 * (`[data-cq-sticky-save]`) so it never covers Save/Discard.
 */
export function HelpFab() {
  const pathname = usePathname() ?? "";
  const { shopPath } = useShopSlug();
  const [open, setOpen] = useState(false);
  const [hiddenForSaveBar, setHiddenForSaveBar] = useState(false);
  const titleId = useId();

  useEffect(() => {
    function sync() {
      setHiddenForSaveBar(Boolean(document.querySelector("[data-cq-sticky-save]")));
    }
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, [pathname]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (hiddenForSaveBar) return null;
  if (/\/admin\/(login)(\/|$)/.test(pathname)) return null;

  const lineUrl = resolveClipperqSupportLineUrl();
  const reportHref = shopPath("/admin/support/report");
  const featureHref = shopPath("/admin/support/feature");
  const setupHref = shopPath("/admin/support/setup");

  return (
    <>
      <button
        type="button"
        aria-label="ความช่วยเหลือ"
        aria-expanded={open}
        aria-controls={open ? titleId : undefined}
        data-testid="support-help-fab"
        onClick={() => setOpen((v) => !v)}
        className="cq-press fixed z-40 flex h-14 w-14 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-amber-400 shadow-lg shadow-black/40 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] right-4 lg:bottom-6 lg:right-6"
      >
        {open ? <X size={22} strokeWidth={2} /> : <HelpCircle size={24} strokeWidth={2} />}
      </button>

      {open ? (
        <div
          id={titleId}
          role="dialog"
          aria-label="เมนูความช่วยเหลือ"
          data-testid="support-help-menu"
          className="fixed z-40 w-[min(100%-2rem,20rem)] rounded-2xl border border-zinc-800 bg-zinc-950 p-3 shadow-xl shadow-black/50 bottom-[calc(9.5rem+env(safe-area-inset-bottom,0px))] right-4 lg:bottom-24 lg:right-6"
        >
          <p className="mb-2 px-1 text-xs text-zinc-500">{SUPPORT_REPLY_SLA_COPY_TH}</p>
          <nav className="flex flex-col gap-1">
            <MenuLink
              href={setupHref}
              icon={<Wrench size={18} />}
              title="ตั้งค่าร้านครั้งแรก"
              hint="เช็คลิสต์ + ขอทีมช่วย"
              onNavigate={() => setOpen(false)}
            />
            <MenuLink
              href={reportHref}
              icon={<HelpCircle size={18} />}
              title="แจ้งปัญหา"
              hint="ข้อความ + รูปหน้าจอ"
              onNavigate={() => setOpen(false)}
            />
            <MenuLink
              href={featureHref}
              icon={<Sparkles size={18} />}
              title="ขอฟีเจอร์"
              hint="บอกเราว่าอยากได้อะไร"
              onNavigate={() => setOpen(false)}
            />
            <a
              href={lineUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="cq-press flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 text-left text-zinc-100 hover:bg-zinc-900"
              data-testid="support-help-line"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-amber-400">
                <MessageCircle size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">แชทบน LINE</span>
                <span className="block text-xs text-zinc-500">ClipperQ OA @404qsemd</span>
              </span>
            </a>
          </nav>
        </div>
      ) : null}
    </>
  );
}

function MenuLink({
  href,
  icon,
  title,
  hint,
  onNavigate,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  hint: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="cq-press flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 text-left text-zinc-100 hover:bg-zinc-900"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-amber-400">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-zinc-500">{hint}</span>
      </span>
    </Link>
  );
}
