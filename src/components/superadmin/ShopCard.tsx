"use client";

import { useEffect, useState } from "react";
import {
  BARBER_TIERS,
  isOverTier,
  tierRangeLabelTh,
  type BarberTierId,
} from "@/lib/billing/barber-tier";
import { overTierFlagLabel } from "@/lib/billing/over-tier-flags";
import { buildShopLiffUrl, buildShopWebUrl } from "@/lib/line/liff-url";
import { buildOwnerInviteUrl } from "@/lib/owner/invite-url";
import type { BarberRole, Shop } from "@/types/booking";

const OVER_TIER_FLAG_PREFIX = "เกินแพ็ก";

export interface ShopStaffSummary {
  id: string;
  name: string;
  role: BarberRole | string;
  lineLinked: boolean;
}

interface ShopCardProps {
  shop: Shop & {
    ownerName?: string | null;
    claimed?: boolean;
    setupReady?: boolean;
    hasFirstBooking?: boolean;
    bookableCount?: number;
    seatBookableCount?: number;
    overTier?: boolean;
    seatFlags?: string[];
    recommendedTier?: string;
    recommendedTierLabel?: string;
    recommendedPriceLabel?: string | null;
    showBillingNotice?: boolean;
    staff?: ShopStaffSummary[];
  };
  superAdminToken?: string;
  onRegenerated?: () => void;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function CopyRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-zinc-300">{label}</p>
      <p className="break-all text-xs text-zinc-500">{value}</p>
      <button
        type="button"
        onClick={onCopy}
        className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold"
      >
        {copied ? "Copied!" : "คัดลอก"}
      </button>
    </div>
  );
}

export function ShopCard({ shop, superAdminToken, onRegenerated }: ShopCardProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState(shop.invite_token);
  const [inviteExpiresAt, setInviteExpiresAt] = useState(shop.invite_expires_at);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);
  const [staff, setStaff] = useState<ShopStaffSummary[]>(shop.staff ?? []);

  useEffect(() => {
    setStaff(shop.staff ?? []);
  }, [shop.staff]);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);
  const [unlinkError, setUnlinkError] = useState<string | null>(null);
  const [unlinkSuccess, setUnlinkSuccess] = useState<string | null>(null);
  const [barberTier, setBarberTier] = useState<BarberTierId>(
    (shop.barber_tier as BarberTierId) ?? "tier1",
  );
  const [tierSaving, setTierSaving] = useState(false);
  const [tierError, setTierError] = useState<string | null>(null);
  const [tierSavedToast, setTierSavedToast] = useState(false);
  const [overTier, setOverTier] = useState(Boolean(shop.overTier));
  const [seatFlags, setSeatFlags] = useState<string[]>(shop.seatFlags ?? []);
  useEffect(() => {
    setBarberTier((shop.barber_tier as BarberTierId) ?? "tier1");
    setOverTier(Boolean(shop.overTier));
    setSeatFlags(shop.seatFlags ?? []);
  }, [shop.barber_tier, shop.overTier, shop.seatFlags]);
  useEffect(() => {
    if (!tierSavedToast) return;
    const timer = window.setTimeout(() => setTierSavedToast(false), 2500);
    return () => window.clearTimeout(timer);
  }, [tierSavedToast]);

  function applyTierLocally(next: BarberTierId) {
    const seats = shop.seatBookableCount ?? 0;
    const nextOver = isOverTier(seats, next);
    setBarberTier(next);
    setOverTier(nextOver);
    setSeatFlags((prev) => {
      const withoutOver = prev.filter(
        (label) =>
          !label.startsWith(OVER_TIER_FLAG_PREFIX) &&
          !label.startsWith("เกิน tier"),
      );
      if (!nextOver) return withoutOver;
      return [overTierFlagLabel(seats, next), ...withoutOver];
    });
  }
  const expires = shop.subscribed_until
    ? new Date(shop.subscribed_until).toLocaleDateString("th-TH")
    : "—";
  const inviteExpires = inviteExpiresAt
    ? new Date(inviteExpiresAt).toLocaleDateString("th-TH")
    : null;
  const inviteUrl = inviteToken ? buildOwnerInviteUrl(inviteToken) : null;
  const webUrl = shop.slug ? buildShopWebUrl(shop.slug) : null;
  const liffUrl = shop.slug ? buildShopLiffUrl(shop.slug) : null;

  async function handleCopy(key: string, value: string) {
    const ok = await copyText(value);
    if (ok) setCopiedKey(key);
  }

  function unlinkConfirmMessage(member: ShopStaffSummary): string {
    const base =
      `ต้องการยกเลิกการผูก LINE ของ ${member.name} หรือไม่?\n` +
      "ประวัติคิวจะยังอยู่ แต่บัญชี LINE นี้จะไม่สามารถเข้าใช้งานในสิทธิ์เดิมได้จนกว่าจะผูกใหม่";
    if (member.role === "owner") {
      return (
        `${base}\n\n` +
        "⚠ เจ้าของร้าน: หลังยกเลิกจะไม่สามารถเข้าแอดมินร้านนี้ด้วย LINE account เดิม " +
        "(สถานะร้านและการ claim ไม่เปลี่ยน)"
      );
    }
    return base;
  }

  async function handleUnlinkLine(member: ShopStaffSummary) {
    if (!superAdminToken || !member.lineLinked) return;
    if (!window.confirm(unlinkConfirmMessage(member))) return;

    setUnlinkingId(member.id);
    setUnlinkError(null);
    setUnlinkSuccess(null);
    try {
      const res = await fetch(
        `/api/superadmin/shops/${shop.id}/barbers/${member.id}/unlink-line`,
        {
          method: "POST",
          headers: { "x-superadmin-token": superAdminToken },
        },
      );
      const json = (await res.json()) as {
        barber?: { lineLinked?: boolean };
        error?: { message?: string } | string;
      };
      if (!res.ok) {
        setUnlinkError(
          typeof json.error === "string"
            ? json.error
            : json.error?.message ?? "ยกเลิกการผูก LINE ไม่สำเร็จ",
        );
        return;
      }
      setStaff((prev) =>
        prev.map((s) =>
          s.id === member.id ? { ...s, lineLinked: false } : s,
        ),
      );
      setUnlinkSuccess(`ยกเลิกการผูก LINE ของ ${member.name} แล้ว`);
      onRegenerated?.();
    } catch {
      setUnlinkError("ยกเลิกการผูก LINE ไม่สำเร็จ");
    } finally {
      setUnlinkingId(null);
    }
  }

  async function handleRegenerateInvite() {
    if (!superAdminToken || shop.status !== "pending") return;
    const confirmed = window.confirm(
      "ลิงก์เดิมจะใช้ไม่ได้ทันที ต้องการสร้างลิงก์ใหม่หรือไม่?",
    );
    if (!confirmed) return;

    setRegenerating(true);
    setRegenerateError(null);
    try {
      const res = await fetch(`/api/superadmin/shops/${shop.id}/invite`, {
        method: "POST",
        headers: { "x-superadmin-token": superAdminToken },
      });
      const json = (await res.json()) as {
        shop?: Shop;
        error?: { code?: string; message?: string } | string;
      };
      if (!res.ok) {
        const code =
          typeof json.error === "object" ? json.error?.code : undefined;
        if (res.status === 409 || code === "INVITE_ALREADY_CLAIMED") {
          setRegenerateError("ร้านนี้มีเจ้าของแล้ว ไม่สามารถสร้างลิงก์เชิญใหม่");
          return;
        }
        setRegenerateError(
          typeof json.error === "string"
            ? json.error
            : json.error?.message ?? "สร้างลิงก์เชิญใหม่ไม่สำเร็จ",
        );
        return;
      }
      if (json.shop?.invite_token) {
        setInviteToken(json.shop.invite_token);
        setInviteExpiresAt(json.shop.invite_expires_at ?? null);
      }
      onRegenerated?.();
    } catch {
      setRegenerateError("สร้างลิงก์เชิญใหม่ไม่สำเร็จ");
    } finally {
      setRegenerating(false);
    }
  }

  async function handleTierChange(next: BarberTierId) {
    if (!superAdminToken || next === barberTier) return;
    setTierSaving(true);
    setTierError(null);
    setTierSavedToast(false);
    try {
      const res = await fetch(`/api/superadmin/shops/${shop.id}/barber-tier`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-superadmin-token": superAdminToken,
        },
        body: JSON.stringify({ barberTier: next }),
      });
      const json = (await res.json()) as {
        shop?: Shop;
        error?: string;
      };
      if (!res.ok) {
        setTierError(json.error ?? "อัปเดตแพ็กไม่สำเร็จ");
        return;
      }
      // Recompute badge/flags immediately so dropdown and status never contradict.
      applyTierLocally(next);
      setTierSavedToast(true);
      onRegenerated?.();
    } catch {
      setTierError("อัปเดตแพ็กไม่สำเร็จ");
    } finally {
      setTierSaving(false);
    }
  }

  const statusClass =
    shop.status === "active"
      ? "bg-emerald-700/30 text-emerald-300"
      : shop.status === "pending"
        ? "bg-amber-500/20 text-amber-300"
        : "bg-zinc-700 text-zinc-300";

  return (
    <div
      className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
      data-testid="superadmin-shop-card"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold">{shop.name}</h3>
          <p className="text-xs text-zinc-400">
            Owner: {shop.ownerName ?? "รอ claim"}
          </p>
          <p className="text-xs text-zinc-400">Slug: {shop.slug ?? "—"}</p>
          <p className="text-xs text-zinc-400">Status: {shop.status}</p>
          <p className="text-xs text-zinc-400">Expires: {expires}</p>
          {shop.status !== "pending" ? (
            <p className="text-xs text-zinc-400">
              Setup: {shop.setupReady ? "ready" : "incomplete"}
              {shop.hasFirstBooking ? " · first booking" : ""}
              {shop.seatBookableCount !== undefined
                ? ` · จองได้ ${shop.seatBookableCount} คน`
                : shop.bookableCount !== undefined
                  ? ` · จองได้ ${shop.bookableCount} คน`
                  : ""}
            </p>
          ) : null}
          {shop.recommendedTierLabel ? (
            <p
              className="text-xs text-amber-200/90"
              data-testid="recommended-tier"
            >
              แนะนำแพ็ก: {shop.recommendedTierLabel}
              {shop.recommendedPriceLabel
                ? ` ${shop.recommendedPriceLabel}/เดือน`
                : " (ติดต่อคุยราคา)"}
              {shop.showBillingNotice ? " · แจ้งในแอดมินแล้ว" : ""}
            </p>
          ) : null}
          {shop.status === "pending" && inviteExpires ? (
            <p className="text-xs text-amber-400">Invite expires: {inviteExpires}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={`rounded-full px-2 py-0.5 text-xs ${statusClass}`}>
            {shop.status}
          </span>
          {overTier ? (
            <span
              data-testid="over-tier-badge"
              className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-300"
            >
              เกินแพ็ก
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
        <label className="block text-xs font-medium text-zinc-300">
          แพ็กช่าง
          <select
            data-testid="barber-tier-select"
            value={barberTier}
            disabled={!superAdminToken || tierSaving}
            onChange={(e) => void handleTierChange(e.target.value as BarberTierId)}
            className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-sm text-zinc-100 disabled:opacity-50"
          >
            {BARBER_TIERS.map((id) => (
              <option key={id} value={id}>
                แพ็ก {tierRangeLabelTh(id)}
              </option>
            ))}
          </select>
        </label>
        {tierSaving ? (
          <p className="text-xs text-zinc-400">กำลังบันทึก…</p>
        ) : null}
        {tierSavedToast ? (
          <p className="text-xs text-emerald-400" data-testid="tier-saved-toast">
            บันทึกแล้ว
          </p>
        ) : null}
        {tierError ? <p className="text-xs text-red-400">{tierError}</p> : null}
        {seatFlags.length > 0 ? (
          <div data-testid="seat-flags">
            <p className="text-xs font-medium text-zinc-300">Flags (read-only)</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] text-amber-200/90">
              {seatFlags.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-[11px] text-zinc-500" data-testid="seat-flags-empty">
            Flags: none
          </p>
        )}
      </div>
      {shop.slug ? (
        <div className="mt-3 space-y-3 border-t border-zinc-800 pt-3">
          {liffUrl ? (
            <CopyRow
              label="ลิงก์จอง (ติดบน OA ร้าน)"
              value={liffUrl}
              copied={copiedKey === "liff"}
              onCopy={() => void handleCopy("liff", liffUrl)}
            />
          ) : null}
          {webUrl ? (
            <CopyRow
              label="ลิงก์เว็บ"
              value={webUrl}
              copied={copiedKey === "web"}
              onCopy={() => void handleCopy("web", webUrl)}
            />
          ) : null}
        </div>
      ) : null}
      {shop.status === "pending" && superAdminToken ? (
        <div className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
          {inviteUrl ? (
            <CopyRow
              label="Invite Owner"
              value={inviteUrl}
              copied={copiedKey === "invite"}
              onCopy={() => void handleCopy("invite", inviteUrl)}
            />
          ) : null}
          <button
            type="button"
            onClick={() => void handleRegenerateInvite()}
            disabled={regenerating}
            className="rounded-lg border border-amber-500/40 px-3 py-2 text-xs font-semibold text-amber-400 disabled:opacity-50"
          >
            {regenerating ? "กำลังสร้าง..." : "สร้างลิงก์เชิญใหม่"}
          </button>
          {regenerateError ? (
            <p className="text-xs text-red-400">{regenerateError}</p>
          ) : null}
        </div>
      ) : inviteUrl ? (
        <div className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
          <CopyRow
            label="Invite Owner"
            value={inviteUrl}
            copied={copiedKey === "invite"}
            onCopy={() => void handleCopy("invite", inviteUrl)}
          />
        </div>
      ) : null}
      {staff.length > 0 ? (
        <div className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
          <p className="text-xs font-medium text-zinc-300">ทีมงาน</p>
          {unlinkSuccess ? (
            <p className="text-xs text-emerald-400">{unlinkSuccess}</p>
          ) : null}
          {unlinkError ? (
            <p className="text-xs text-red-400">{unlinkError}</p>
          ) : null}
          <ul className="space-y-2">
            {staff.map((member) => (
              <li
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-zinc-800/50 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-zinc-200">
                    {member.name}
                    {member.role === "owner" ? (
                      <span className="ml-1 text-amber-400">(เจ้าของ)</span>
                    ) : null}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {member.lineLinked ? "ผูก LINE แล้ว" : "ยังไม่ผูก LINE"}
                  </p>
                </div>
                {member.lineLinked && superAdminToken ? (
                  <button
                    type="button"
                    onClick={() => void handleUnlinkLine(member)}
                    disabled={unlinkingId === member.id}
                    className="shrink-0 rounded-lg border border-red-500/40 px-2 py-1 text-[11px] font-semibold text-red-400 disabled:opacity-50"
                  >
                    {unlinkingId === member.id ? "กำลังยกเลิก..." : "ยกเลิกการผูก LINE"}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
