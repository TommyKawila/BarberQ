"use client";

import { MoreHorizontal } from "lucide-react";
import {
  deriveTodayQueueCards,
  sourceLabel,
  type TodayQueueCardModel,
} from "@/lib/admin/today-queue-cards";
import { useI18n } from "@/lib/i18n/locale-provider";
import { formatSlotTime } from "@/lib/services/slot-service";
import { barberLabel, type AdminColumn, type AdminSlot } from "@/types/booking";

interface TodayQueueCardsProps {
  columns: AdminColumn[];
  editableBarberId?: string | null;
  outcomePendingKey?: string | null;
  latePendingKey?: string | null;
  onWalkInBarber: (barberId: string) => void;
  onOutcome: (barberId: string, slot: AdminSlot, outcome: "completed" | "no_show") => void;
  onLateOrNoShow: (barberId: string, slot: AdminSlot) => void;
  onOpenNext?: (barberId: string, slot: AdminSlot) => void;
  onBarberMenu?: (barberId: string) => void;
}

function CardActions({
  card,
  canEdit,
  pending,
  onWalkInBarber,
  onOutcome,
  onLateOrNoShow,
}: {
  card: TodayQueueCardModel;
  canEdit: boolean;
  pending: boolean;
  onWalkInBarber: (barberId: string) => void;
  onOutcome: TodayQueueCardsProps["onOutcome"];
  onLateOrNoShow: TodayQueueCardsProps["onLateOrNoShow"];
}) {
  const { t } = useI18n();

  if (card.state === "cutting" && card.current && canEdit) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => onOutcome(card.barberId, card.current!, "completed")}
          className="flex min-h-11 items-center justify-center gap-1 rounded-xl border border-zinc-600 text-sm font-medium text-zinc-100 disabled:opacity-50"
        >
          ✓ {t("admin.completed")}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => onLateOrNoShow(card.barberId, card.current!)}
          className="flex min-h-11 items-center justify-center rounded-xl border border-zinc-600 text-sm font-medium text-zinc-100 disabled:opacity-50"
        >
          {t("admin.lateNoShow")}
        </button>
      </div>
    );
  }

  if (card.state === "free" && canEdit) {
    return (
      <button
        type="button"
        onClick={() => onWalkInBarber(card.barberId)}
        className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl border border-zinc-600 text-sm font-medium text-zinc-100"
      >
        + {t("admin.queueWithBarber").replace("{name}", card.barberName)}
      </button>
    );
  }

  return null;
}

export function TodayQueueCards(props: TodayQueueCardsProps) {
  const { locale, t } = useI18n();
  const cards = deriveTodayQueueCards(props.columns);
  const sourceLabels = {
    line: t("admin.sourceLine"),
    walkIn: t("admin.sourceWalkIn"),
    phone: t("admin.sourcePhone"),
    chat: t("admin.sourceChat"),
  };

  if (cards.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-10 text-center">
        <p className="text-sm text-zinc-400">{t("admin.noQueueToday")}</p>
      </section>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {cards.map((card) => {
        const canEdit =
          props.editableBarberId == null || props.editableBarberId === card.barberId;
        const displayName = barberLabel(card.barberName, locale);
        const currentKey = card.current
          ? `${card.barberId}:${card.current.startTime}`
          : "";
        const pending =
          props.outcomePendingKey === currentKey || props.latePendingKey === currentKey;

        return (
          <article
            key={card.barberId}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    card.state === "cutting"
                      ? "bg-amber-400"
                      : card.state === "free"
                        ? "bg-emerald-400"
                        : "bg-zinc-500"
                  }`}
                  aria-hidden
                />
                <p className="truncate text-sm">
                  <span className="font-heading font-semibold text-zinc-100 underline decoration-zinc-600 underline-offset-2">
                    {displayName}
                  </span>{" "}
                  <span className="text-zinc-400">
                    {card.state === "cutting"
                      ? t("admin.cuttingNow")
                      : card.state === "free"
                        ? t("admin.freeNow")
                        : t("admin.idleNow")}
                  </span>
                </p>
              </div>
              {props.onBarberMenu ? (
                <button
                  type="button"
                  aria-label={t("admin.barberOptions")}
                  onClick={() => props.onBarberMenu?.(card.barberId)}
                  className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-zinc-400"
                >
                  <MoreHorizontal size={20} />
                </button>
              ) : (
                <span className="min-h-11 min-w-11" aria-hidden />
              )}
            </div>

            {card.state === "cutting" && card.current ? (
              <div className="mt-3">
                <p className="font-heading text-2xl font-semibold text-zinc-50">
                  {card.current.customerName}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  {formatSlotTime(card.current.startTime)}–
                  {formatSlotTime(card.current.endTime)} ·{" "}
                  {sourceLabel(card.current.source, card.current.viaQr, sourceLabels)} ·{" "}
                  {t("admin.remainingMinutes").replace(
                    "{n}",
                    String(card.remainingMinutes ?? 0),
                  )}
                </p>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-[width]"
                    style={{ width: `${Math.round(card.progress * 100)}%` }}
                  />
                </div>
              </div>
            ) : null}

            {card.state === "free" ? (
              <div className="mt-3">
                <p className="font-heading text-2xl font-semibold text-zinc-50">
                  {t("admin.freeUntil").replace(
                    "{time}",
                    card.freeUntil ? formatSlotTime(card.freeUntil) : "—",
                  )}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  {t("admin.walkInReadyMinutes").replace(
                    "{n}",
                    String(card.freeMinutes ?? 0),
                  )}
                </p>
              </div>
            ) : null}

            {card.state === "idle" ? (
              <p className="mt-3 text-sm text-zinc-500">{t("admin.noActiveSlot")}</p>
            ) : null}

            <CardActions
              card={{ ...card, barberName: displayName }}
              canEdit={canEdit}
              pending={pending}
              onWalkInBarber={props.onWalkInBarber}
              onOutcome={props.onOutcome}
              onLateOrNoShow={props.onLateOrNoShow}
            />

            {card.next ? (
              <button
                type="button"
                onClick={() => props.onOpenNext?.(card.barberId, card.next!)}
                className="mt-3 flex min-h-11 w-full items-center justify-between border-t border-zinc-800 pt-3 text-left text-sm text-zinc-300"
              >
                <span>
                  {t("admin.nextUp")} {formatSlotTime(card.next.startTime)}{" "}
                  {card.next.customerName} (
                  {sourceLabel(card.next.source, card.next.viaQr, sourceLabels)})
                </span>
                <span className="text-zinc-500" aria-hidden>
                  ›
                </span>
              </button>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
