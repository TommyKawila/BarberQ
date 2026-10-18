"use client";

import { clipperqIconSrc } from "@/lib/brand/barberqx";
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
  const surface = theme === "dark" ? "dark" : "light";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={clipperqIconSrc(surface, size)}
      alt=""
      width={size}
      height={size}
      className="shrink-0"
      aria-hidden="true"
      decoding="async"
    />
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
