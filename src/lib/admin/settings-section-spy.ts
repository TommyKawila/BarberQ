/** Matches `scroll-mt-[72px]` on settings sections. */
export const SETTINGS_SPY_HEADER_OFFSET_PX = 72;
/** Near-top scroll: always pin the first section. */
export const SETTINGS_SPY_TOP_EPSILON_PX = 16;

/**
 * Pick the section whose top most recently crossed the header offset line.
 * At scrollTop ≈ 0, always returns the first id.
 */
export function resolveActiveSettingsSection(opts: {
  sectionIds: readonly string[];
  /** Absolute tops within the scroll root (same coordinate space as scrollTop). */
  sectionTops: readonly number[];
  scrollTop: number;
  headerOffset?: number;
  topEpsilon?: number;
}): string {
  const { sectionIds, sectionTops, scrollTop } = opts;
  if (sectionIds.length === 0) return "";
  const first = sectionIds[0]!;
  if (sectionTops.length !== sectionIds.length) return first;

  const topEpsilon = opts.topEpsilon ?? SETTINGS_SPY_TOP_EPSILON_PX;
  if (scrollTop <= topEpsilon) return first;

  const headerOffset = opts.headerOffset ?? SETTINGS_SPY_HEADER_OFFSET_PX;
  const marker = scrollTop + headerOffset;
  let active = first;
  for (let i = 0; i < sectionTops.length; i += 1) {
    if (sectionTops[i]! <= marker) {
      active = sectionIds[i]!;
    } else {
      break;
    }
  }
  return active;
}

export function findVerticalScrollRoot(from: HTMLElement): HTMLElement | Window {
  let node: HTMLElement | null = from.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    const { overflowY } = getComputedStyle(node);
    if (
      (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
      node.scrollHeight > node.clientHeight + 1
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return window;
}

export function getScrollTop(root: HTMLElement | Window): number {
  if (root === window) {
    return window.scrollY || document.documentElement.scrollTop || 0;
  }
  return (root as HTMLElement).scrollTop;
}

/** Section top positions in the scroll root's coordinate space. */
export function measureSectionTops(
  sections: readonly HTMLElement[],
  root: HTMLElement | Window,
): number[] {
  if (root === window) {
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    return sections.map((el) => el.getBoundingClientRect().top + scrollY);
  }
  const rootEl = root as HTMLElement;
  const rootRect = rootEl.getBoundingClientRect();
  const scrollTop = rootEl.scrollTop;
  return sections.map((el) => el.getBoundingClientRect().top - rootRect.top + scrollTop);
}
