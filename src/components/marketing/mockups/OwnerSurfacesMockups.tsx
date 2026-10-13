import { PhoneScreen } from "./PhoneScreen";
import type { PhoneSize } from "./PhoneFrame";
import type { MarketingScreenKey } from "@/lib/marketing/screens";

const PHONE_MOBILE = "mx-auto w-[min(64vw,268px)]";
const PHONE_DESKTOP = "mx-auto w-full max-w-[280px]";

const SURFACE_SCREENS: Record<"queue" | "team", MarketingScreenKey> = {
  queue: "adminQueue",
  team: "adminTeam",
};

type FrameProps = {
  screen: MarketingScreenKey;
  size?: PhoneSize;
  fluid?: boolean;
  className?: string;
};

function SurfaceFrame({ screen, size, fluid, className }: FrameProps) {
  return (
    <PhoneScreen
      screen={screen}
      size={size}
      fluid={fluid}
      className={className ?? "mx-auto"}
    />
  );
}

export function OwnerSurfacePhone({ surface }: { surface: "queue" | "team" }) {
  const screen = SURFACE_SCREENS[surface];
  return (
    <>
      <div className="lg:hidden">
        <SurfaceFrame screen={screen} fluid className={PHONE_MOBILE} />
      </div>
      <div className="hidden lg:block">
        <SurfaceFrame screen={screen} fluid className={PHONE_DESKTOP} />
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
      <SurfaceFrame screen="adminQueue" size="md" />
      <SurfaceFrame
        screen="adminTeam"
        size="md"
        className="mx-auto md:-mt-6 md:rotate-1"
      />
    </div>
  );
}
