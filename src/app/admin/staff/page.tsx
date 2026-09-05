"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAdminSession } from "@/lib/admin/use-admin-session";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { StaffRole } from "@/lib/data/types";
import { barberLabel, type Barber } from "@/types/booking";

interface StaffRow {
  id: string;
  name: string;
  role: StaffRole;
  token: string;
  barberId: string | null;
  active: boolean;
  createdAt: string;
}

interface ApiError {
  error?: { code?: string; message?: string };
}

export default function AdminStaffPage() {
  const { t, locale } = useI18n();
  const {
    tokenInput,
    setTokenInput,
    session,
    meta,
    loading,
    error,
    setError,
    authHeaders,
    unlock,
    isSuperAdmin,
    needsUnlock,
  } = useAdminSession();
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState<StaffRole>("barber");
  const [barberId, setBarberId] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const loadStaff = useCallback(async () => {
    const res = await fetch("/api/staff", { headers: authHeaders });
    const json = (await res.json()) as { staff?: StaffRow[] } & ApiError;
    if (!res.ok) {
      setError(json.error?.message ?? t("admin.loadFailed"));
      return;
    }
    setError(null);
    setStaff(json.staff ?? []);
  }, [authHeaders, setError, t]);

  useEffect(() => {
    if (loading || needsUnlock || !isSuperAdmin) return;
    let cancelled = false;
    void (async () => {
      const barberRes = await fetch("/api/barbers");
      const barberJson = (await barberRes.json()) as { barbers?: Barber[] };
      if (cancelled) return;
      setBarbers(barberJson.barbers ?? []);
      await loadStaff();
    })();
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin, loadStaff, loading, needsUnlock]);

  async function createStaff() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCreating(true);
    setFormMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          name: trimmed,
          role,
          barberId: barberId || null,
        }),
      });
      const json = (await res.json()) as { loginUrl?: string } & ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.updateFailed"));
        return;
      }
      setName("");
      setRole("barber");
      setBarberId("");
      setFormMessage(t("admin.staffCreated"));
      await loadStaff();
    } catch {
      setError(t("admin.updateFailed"));
    } finally {
      setCreating(false);
    }
  }

  async function deactivateStaff(staffId: string) {
    setError(null);
    const res = await fetch("/api/staff", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ staffId }),
    });
    const json = (await res.json()) as ApiError;
    if (!res.ok) {
      setError(json.error?.message ?? t("admin.updateFailed"));
      return;
    }
    await loadStaff();
  }

  async function copyLoginLink(token: string, id: string) {
    const url = `${window.location.origin}/a/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 2000);
  }

  function barberName(id: string | null): string {
    if (!id) return "—";
    const barber = barbers.find((b) => b.id === id);
    return barber ? barberLabel(barber.name, locale) : "—";
  }

  if (loading) {
    return (
      <section className="flex min-h-full flex-col gap-4 px-4 py-10">
        <p className="text-sm text-zinc-400">{t("common.loading")}</p>
      </section>
    );
  }

  if (needsUnlock) {
    return (
      <section className="flex min-h-full flex-col gap-4 px-4 py-10">
        <h1 className="text-2xl font-semibold">{t("admin.staffManagement")}</h1>
        <p className="text-sm text-zinc-400">{t("admin.unlockHint")}</p>
        <input
          type="password"
          value={tokenInput}
          onChange={(event) => setTokenInput(event.target.value)}
          className="min-h-12 rounded-xl bg-zinc-900 px-3 outline-none ring-amber-400 focus:ring-2"
        />
        <button
          type="button"
          onClick={unlock}
          className="min-h-12 rounded-xl bg-amber-400 font-semibold text-zinc-950"
        >
          {t("admin.unlock")}
        </button>
      </section>
    );
  }

  if (!isSuperAdmin) {
    return (
      <section className="flex min-h-full flex-col gap-4 px-4 py-10">
        <h1 className="text-2xl font-semibold">{t("admin.staffManagement")}</h1>
        <p className="text-sm text-red-400">{t("admin.forbiddenSuperAdminOnly")}</p>
        <Link href="/admin" className="text-sm text-amber-400 underline">
          {t("admin.backToBoard")}
        </Link>
      </section>
    );
  }

  const activeStaff = staff.filter((row) => row.active);
  const inactiveStaff = staff.filter((row) => !row.active);

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <header className="flex items-start justify-between gap-2">
        <div>
          {meta.prototypeMode ? (
            <span className="mb-1 inline-block rounded bg-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-400">
              {t("common.prototypeMode")}
            </span>
          ) : null}
          <h1 className="text-xl font-semibold">{t("admin.staffManagement")}</h1>
          {session ? <p className="mt-1 text-xs text-zinc-500">{session.name}</p> : null}
        </div>
        <Link
          href="/admin"
          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200"
        >
          {t("admin.backToBoard")}
        </Link>
      </header>

      <section className="rounded-2xl bg-zinc-900 p-4">
        <h2 className="text-sm font-semibold">{t("admin.createStaff")}</h2>
        <div className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            {t("admin.staffName")}
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="min-h-11 rounded-lg bg-zinc-800 px-3 outline-none ring-amber-400 focus:ring-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("admin.staffRole")}
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as StaffRole)}
              className="min-h-11 rounded-lg bg-zinc-800 px-3 outline-none ring-amber-400 focus:ring-2"
            >
              <option value="barber">{t("admin.roleBarber")}</option>
              <option value="super_admin">{t("admin.roleSuperAdmin")}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("admin.linkBarber")}
            <select
              value={barberId}
              onChange={(event) => setBarberId(event.target.value)}
              className="min-h-11 rounded-lg bg-zinc-800 px-3 outline-none ring-amber-400 focus:ring-2"
            >
              <option value="">—</option>
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.id}>
                  {barberLabel(barber.name, locale)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={creating || !name.trim()}
            onClick={() => void createStaff()}
            className="min-h-12 rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
          >
            {t("admin.createStaff")}
          </button>
        </div>
        {formMessage ? <p className="mt-3 text-sm text-emerald-400">{formMessage}</p> : null}
      </section>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">{t("admin.activeStaff")}</h2>
        {activeStaff.length === 0 ? (
          <p className="text-sm text-zinc-500">{t("admin.noStaff")}</p>
        ) : (
          activeStaff.map((row) => (
            <div key={row.id} className="rounded-2xl bg-zinc-900 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{row.name}</p>
                  <p className="text-xs text-zinc-400">
                    {row.role === "super_admin"
                      ? t("admin.roleSuperAdmin")
                      : t("admin.roleBarber")}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {t("admin.linkBarber")}: {barberName(row.barberId)}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void copyLoginLink(row.token, row.id)}
                  className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200"
                >
                  {copiedId === row.id ? t("admin.loginLinkCopied") : t("admin.copyLoginLink")}
                </button>
                <button
                  type="button"
                  onClick={() => void deactivateStaff(row.id)}
                  className="rounded-lg border border-red-800 px-3 py-1.5 text-xs text-red-300"
                >
                  {t("admin.deactivate")}
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {inactiveStaff.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">{t("admin.inactiveStaff")}</h2>
          {inactiveStaff.map((row) => (
            <div key={row.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 opacity-60">
              <p className="font-semibold">{row.name}</p>
              <p className="text-xs text-zinc-500">
                {row.role === "super_admin"
                  ? t("admin.roleSuperAdmin")
                  : t("admin.roleBarber")}
              </p>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
