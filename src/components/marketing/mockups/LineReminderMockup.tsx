import { PhoneFrame } from "./PhoneFrame";
import { WarmNoteFlexCard, type WarmNoteVariant } from "./WarmNoteFlexCard";

function LineWarmNotePhone({
  shopName,
  variant,
  whenLabel,
}: {
  shopName: string;
  variant: WarmNoteVariant;
  whenLabel?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-[210px] shrink-0 lg:max-w-[230px]">
      <PhoneFrame fluid className="mx-auto w-full">
        <div className="flex h-full flex-col bg-[#747474] text-[11px] leading-snug text-zinc-900">
          <div className="flex h-[9%] shrink-0 items-end justify-between px-[5%] pb-[1.5%] text-[10px] font-semibold text-white">
            <span>9:41</span>
            <span className="flex items-center gap-1 opacity-90">
              <span className="inline-block h-[7px] w-[14px] rounded-[2px] border border-white/80" />
            </span>
          </div>

          <div className="flex items-center gap-2 bg-[#42607A] px-2.5 py-1.5 text-white">
            <span className="text-sm leading-none">‹</span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[11px] font-semibold">{shopName}</span>
              <span className="text-[8px] text-white/70">Official Account</span>
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-center gap-1.5 overflow-hidden bg-[#8CABD0] px-2.5 py-2.5">
            {whenLabel ? (
              <p className="text-center text-[8px] text-zinc-700/80">{whenLabel}</p>
            ) : null}
            <WarmNoteFlexCard variant={variant} shopName={shopName} />
          </div>
        </div>
      </PhoneFrame>
    </div>
  );
}

/** LINE chat phone — Option A · Warm Note appointment reminder. */
export function LineReminderMockup({
  shopName,
  whenLabel,
}: {
  shopName: string;
  whenLabel: string;
}) {
  return (
    <LineWarmNotePhone shopName={shopName} variant="reminder" whenLabel={whenLabel} />
  );
}

/** LINE chat phone — Option A · Warm Note booking confirmation. */
export function LineConfirmMockup({ shopName }: { shopName: string }) {
  return <LineWarmNotePhone shopName={shopName} variant="confirm" />;
}
