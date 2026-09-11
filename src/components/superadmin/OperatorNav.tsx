"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { PlatformBrandHeader } from "@/components/layout/PlatformBrand";
import { useI18n } from "@/lib/i18n/locale-provider";

const LINKS = [
  { href: "/superadmin", key: "superadmin.crm.nav.shops" as const, exact: true },
  { href: "/superadmin/trial-leads", key: "superadmin.crm.nav.leads" as const, exact: false },
];

export function OperatorNav() {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-2.5 md:px-6">
        <PlatformBrandHeader />
        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {LINKS.map((link) => {
            const active = link.exact
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-medium ${
                  active
                    ? "bg-zinc-800 text-amber-400"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
              >
                {t(link.key)}
              </Link>
            );
          })}
        </nav>
        <LanguageToggle />
      </div>
    </header>
  );
}
