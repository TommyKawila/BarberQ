"use client";

import { useI18n } from "@/lib/i18n/locale-provider";

export type PlatformBrandVariant = "mini" | "header" | "icon";
export type PlatformBrandTheme = "dark" | "light";

interface PlatformBrandProps {
  variant?: PlatformBrandVariant;
  theme?: PlatformBrandTheme;
  className?: string;
}

function PlatformIcon({
  size,
  theme,
}: {
  size: number;
  theme: PlatformBrandTheme;
}) {
  const tileClass = theme === "dark" ? "fill-zinc-900" : "fill-zinc-100";
  const iconClass = theme === "dark" ? "text-amber-400/80" : "text-amber-600";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`shrink-0 ${iconClass}`}
    >
      <rect width="32" height="32" rx="8" className={tileClass} />
      <path
        d="M8 12h16v2H8v-2zm2 4h12v1.5H10V16zm-2 6c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v1H8v-1z"
        className="fill-current"
        opacity="0.9"
      />
      <circle cx="22" cy="10" r="5" className="fill-current" />
      <text
        x="22"
        y="12.5"
        textAnchor="middle"
        fontSize="7"
        fontWeight="700"
        className={theme === "dark" ? "fill-zinc-950" : "fill-white"}
      >
        Q
      </text>
    </svg>
  );
}

export function PlatformBrand({
  variant = "mini",
  theme = "dark",
  className,
}: PlatformBrandProps) {
  const { t } = useI18n();

  if (variant === "icon") {
    return (
      <span
        className={`inline-flex shrink-0 ${className ?? ""}`}
        aria-label={t("common.brand")}
      >
        <PlatformIcon size={16} theme={theme} />
      </span>
    );
  }

  if (variant === "header") {
    const textClass =
      theme === "dark" ? "text-xs font-medium text-zinc-400" : "text-xs font-medium text-zinc-600";
    return (
      <span className={`inline-flex min-w-0 items-center gap-1.5 ${className ?? ""}`}>
        <PlatformIcon size={20} theme={theme} />
        <span className={textClass}>{t("common.brand")}</span>
      </span>
    );
  }

  const textClass =
    theme === "dark" ? "text-[10px] font-medium text-zinc-500" : "text-[10px] font-medium text-zinc-600";
  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 ${className ?? ""}`}>
      <PlatformIcon size={16} theme={theme} />
      <span className={textClass}>{t("common.byBrand")}</span>
    </span>
  );
}

export function PlatformBrandMini(props: Omit<PlatformBrandProps, "variant">) {
  return <PlatformBrand {...props} variant="mini" />;
}

export function PlatformBrandHeader(props: Omit<PlatformBrandProps, "variant">) {
  return <PlatformBrand {...props} variant="header" />;
}
