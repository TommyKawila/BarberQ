import { PhoneScreen } from "./PhoneScreen";
import type { MarketingScreenKey } from "@/lib/marketing/screens";

/** Keep feature phones compact on desktop so captions stay readable. */
const PHONE_MOBILE = "mx-auto w-[min(64vw,240px)]";

export type OwnerSurface = "queue" | "team" | "stats";

const SURFACE_SCREENS: Record<OwnerSurface, MarketingScreenKey> = {
  queue: "adminQueue",
  team: "adminTeam",
  stats: "adminStats",
};

type FrameProps = {
  screen: MarketingScreenKey;
  className?: string;
  fluid?: boolean;
  width?: number;
};

function SurfaceFrame({ screen, className, fluid, width }: FrameProps) {
  return (
    <PhoneScreen
      screen={screen}
      fluid={fluid}
      width={width}
      className={className ?? "mx-auto"}
    />
  );
}

export function OwnerSurfacePhone({ surface }: { surface: OwnerSurface }) {
  const screen = SURFACE_SCREENS[surface];
  return (
    <>
      <div className="w-full lg:hidden">
        <SurfaceFrame screen={screen} fluid className={PHONE_MOBILE} />
      </div>
      {/* Fixed width — avoids 0×0 collapse inside flex items-center columns */}
      <div className="hidden w-[200px] shrink-0 lg:block">
        <SurfaceFrame screen={screen} width={200} className="mx-auto" />
      </div>
    </>
  );
}

export function OwnerSurfacesMockups({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <SurfaceFrame screen="adminQueue" fluid className={PHONE_MOBILE} />
        <SurfaceFrame screen="adminTeam" fluid className={PHONE_MOBILE} />
      </div>
    );
  }
  return (
    <div className="relative flex items-end justify-center gap-4 lg:justify-start">
      <SurfaceFrame screen="adminQueue" width={200} />
      <SurfaceFrame screen="adminTeam" width={200} className="mx-auto md:-mt-6 md:rotate-1" />
    </div>
  );
}
