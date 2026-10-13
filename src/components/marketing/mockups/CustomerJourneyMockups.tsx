import { HandPhoneComposite } from "./HandPhoneComposite";
import { PhoneScreen } from "./PhoneScreen";
import type { PhoneSize } from "./PhoneFrame";
import type { MarketingScreenKey } from "@/lib/marketing/screens";

const STEP_SCREENS: Record<1 | 2 | 3, MarketingScreenKey> = {
  1: "landing",
  2: "choose",
  3: "summary",
};

type FrameProps = {
  screen: MarketingScreenKey;
  size?: PhoneSize;
  fluid?: boolean;
  className?: string;
  priority?: boolean;
};

function ScreenFrame({ screen, size, fluid, className, priority }: FrameProps) {
  return (
    <PhoneScreen
      screen={screen}
      size={size}
      fluid={fluid}
      className={className}
      priority={priority}
    />
  );
}

export function CustomerStepPhone({ step }: { step: 1 | 2 | 3 }) {
  const screen = STEP_SCREENS[step];
  return (
    <>
      <div className="lg:hidden">
        <ScreenFrame screen={screen} fluid />
      </div>
      <div className="hidden lg:block">
        <ScreenFrame screen={screen} size="md" />
      </div>
    </>
  );
}

export function CustomerJourneyMockups({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <ScreenFrame screen="landing" fluid />
        <ScreenFrame screen="choose" fluid />
        <ScreenFrame screen="summary" fluid />
      </div>
    );
  }
  return (
    <div className="relative flex items-end justify-center gap-3 md:gap-4 lg:justify-end">
      <ScreenFrame screen="landing" size="sm" />
      <ScreenFrame screen="choose" size="md" />
      <ScreenFrame screen="summary" size="sm" />
    </div>
  );
}

export function HeroProductMockups() {
  return (
    <div className="relative w-full max-w-full min-w-0 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-[12%] rounded-full bg-amber-400/15 blur-3xl"
        aria-hidden
      />
      {/* Mobile: hand-phone slot (falls back to framed phone) */}
      <div className="relative mx-auto w-full max-w-[min(100%,280px)] md:hidden">
        <HandPhoneComposite screen="choose" priority />
      </div>
      {/* md+: identical PhoneFrame screens — no overflow */}
      <div className="relative hidden w-full max-w-full items-end justify-center gap-2 overflow-hidden md:flex lg:justify-end lg:gap-3">
        <div className="w-[min(42%,200px)] shrink">
          <ScreenFrame screen="landing" fluid />
        </div>
        <div className="relative z-10 w-[min(52%,240px)] shrink-0">
          <HandPhoneComposite screen="choose" priority className="w-full" />
        </div>
        <div className="hidden w-[min(42%,200px)] shrink lg:block">
          <ScreenFrame screen="ticket" fluid />
        </div>
      </div>
    </div>
  );
}
