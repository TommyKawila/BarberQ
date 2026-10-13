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
        className="pointer-events-none absolute inset-[8%] rounded-full bg-amber-400/15 blur-3xl"
        aria-hidden
      />
      {/* Primary hero: pre-composited hand + real booking screen */}
      <div className="relative mx-auto w-full max-w-[min(100%,320px)] md:max-w-[min(100%,420px)] lg:ml-auto lg:mr-0">
        <HandPhoneComposite priority />
      </div>
    </div>
  );
}
