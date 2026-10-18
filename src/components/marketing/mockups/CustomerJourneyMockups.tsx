import { HandPhoneComposite } from "./HandPhoneComposite";
import { PhoneScreen } from "./PhoneScreen";
import type { PhoneSize } from "./PhoneFrame";
import type { MarketingScreenKey } from "@/lib/marketing/screens";

/** Match marketing.how.1–3 copy: book flow → LINE ticket → shop queue board */
const STEP_SCREENS: Record<1 | 2 | 3, MarketingScreenKey> = {
  1: "choose",
  2: "ticket",
  3: "adminQueue",
};

/** Compact mobile step 3 uses a grid-focused board crop (desktop keeps full adminQueue). */
const COMPACT_STEP_SCREENS: Record<1 | 2 | 3, MarketingScreenKey> = {
  1: "choose",
  2: "ticket",
  3: "adminQueueBoard",
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

export function CustomerStepPhone({
  step,
  /** Compact mobile how-it-works: single capped phone; step 3 uses a readable board crop. */
  compact,
}: {
  step: 1 | 2 | 3;
  compact?: boolean;
}) {
  const screen = compact ? COMPACT_STEP_SCREENS[step] : STEP_SCREENS[step];
  if (compact) {
    return (
      <PhoneScreen
        screen={screen}
        fluid
        safeTop
        className="mx-auto w-full max-w-[270px]"
      />
    );
  }
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
    <div className="relative w-full max-w-full min-w-0 overflow-x-clip">
      <div
        className="pointer-events-none absolute inset-[8%] rounded-full bg-amber-400/15 blur-3xl"
        aria-hidden
      />
      {/*
        Mobile: break out of section px-4 so the hand-phone fills the screen width.
        Desktop: constrained column, right-aligned on large screens.
      */}
      <div className="relative -mx-4 w-[calc(100%+2rem)] max-w-none md:mx-0 md:w-full md:max-w-[min(100%,440px)] lg:ml-auto lg:mr-0 lg:max-w-[min(100%,480px)]">
        <HandPhoneComposite priority />
      </div>
    </div>
  );
}
