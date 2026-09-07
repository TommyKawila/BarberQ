"use client";

import { useI18n } from "@/lib/i18n/locale-provider";

interface ShopContactLinksProps {
  lineUrl: string | null;
  phone: string | null;
}

export function ShopContactLinks({ lineUrl, phone }: ShopContactLinksProps) {
  const { t } = useI18n();
  if (!lineUrl && !phone) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-zinc-500">{t("booking.contactShop")}</p>
      {lineUrl ? (
        <a
          href={lineUrl}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 text-sm font-semibold text-white"
        >
          {t("booking.shopLine")}
        </a>
      ) : null}
      {phone ? (
        <a
          href={`tel:${phone}`}
          className="flex min-h-11 items-center justify-center rounded-xl bg-sky-700 text-sm font-semibold text-white"
        >
          {t("booking.callShop")} {phone}
        </a>
      ) : null}
    </div>
  );
}
