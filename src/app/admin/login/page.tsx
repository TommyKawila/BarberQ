"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminLineAuth } from "@/lib/admin/use-admin-line-auth";
import { useI18n } from "@/lib/i18n/locale-provider";

export default function AdminLoginPage() {
  const { ready, profile, login, error } = useAdminLineAuth();
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    if (profile) router.replace("/admin");
  }, [profile, router]);

  if (!ready) {
    return (
      <section className="flex min-h-full items-center justify-center px-4 py-16">
        <p className="text-sm text-zinc-400">{t("common.loading")}</p>
      </section>
    );
  }

  return (
    <section className="flex min-h-full flex-col items-center justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">{t("admin.title")}</h1>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button
        type="button"
        onClick={login}
        className="min-h-12 w-full max-w-sm rounded-xl bg-[#06C755] font-semibold text-white"
      >
        {t("booking.loginWithLine")}
      </button>
    </section>
  );
}
