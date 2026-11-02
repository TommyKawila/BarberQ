import type { ReactNode } from "react";

/** ClipperQ Round-1 icons (stroke uses currentColor). */

type CqIconName =
  | "today"
  | "team"
  | "summary"
  | "more"
  | "walkin"
  | "block"
  | "clipper"
  | "copylink"
  | "refresh";

const PATHS: Record<CqIconName, ReactNode> = {
  today: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="4" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
      <path d="M8 15.5l1.3-1.5 1.3 1.5 1.4-1.5 1.3 1.5 1.4-1.5 1.3 1.5" />
    </>
  ),
  team: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
      <path d="M15.5 4.8a3.2 3.2 0 0 1 0 6.4M17 14.6c2 .5 3.2 2.2 3.5 4.9" />
    </>
  ),
  summary: (
    <>
      <path d="M4 20.5h16" />
      <path d="M6 17V12.5l1-1 1 1V17M11 17V8.5l1-1 1 1V17M16 17V5.5l1-1 1 1V17" />
    </>
  ),
  more: (
    <>
      <rect x="3.5" y="6.5" width="17" height="11" rx="5.5" />
      <circle cx="8.3" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15.7" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  walkin: (
    <>
      <rect x="5" y="8" width="9" height="13" rx="3.5" />
      <path d="M5.5 8V5.5l1.2-1.5 1.3 1.5 1.5-1.5 1.5 1.5 1.3-1.5 1.2 1.5V8" />
      <path d="M9.5 12.5v3.5" />
      <path d="M18.5 9v6M15.5 12h6" />
    </>
  ),
  block: (
    <>
      <circle cx="12" cy="12.5" r="8" />
      <path d="M12 8.5v4l2.5 1.5" />
      <path d="M6.3 6.8l11.4 11.4" />
      <path d="M9.5 2.5h5" />
    </>
  ),
  clipper: (
    <>
      <rect x="7" y="8" width="10" height="13" rx="4" />
      <path d="M7.5 8V5l1.1-1.5L9.8 5l1.1-1.5L12 5l1.1-1.5L14.2 5l1.2-1.5L16.5 5v3" />
      <path d="M10.5 13h3" />
    </>
  ),
  copylink: (
    <>
      <rect x="8" y="8" width="12.5" height="12.5" rx="3.5" />
      <path d="M16 5.5V5a1.5 1.5 0 0 0-1.5-1.5h-9A1.5 1.5 0 0 0 4 5v9.5A1.5 1.5 0 0 0 5.5 16H6" />
      <path d="M12.5 15.8l2.6-2.6M13.2 12.6l.9-.9a1.6 1.6 0 0 1 2.3 2.3l-.9.9M14.4 16.4l-.9.9a1.6 1.6 0 0 1-2.3-2.3l.9-.9" />
    </>
  ),
  refresh: (
    <>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.4-5.5" />
      <path d="M19.5 4v4h-4" />
      <path d="M9.5 12.5l.8-.9.9.9.8-.9.9.9.8-.9" />
    </>
  ),
};

export function CqIcon({
  name,
  size = 20,
  className,
  title,
}: {
  name: CqIconName;
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name]}
    </svg>
  );
}

export type { CqIconName };
