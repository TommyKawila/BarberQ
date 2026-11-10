/** True when running as an installed Home Screen / standalone web app. */
export function isStandaloneDisplay(
  win: Window & { navigator: Navigator & { standalone?: boolean } } = window,
): boolean {
  try {
    if (win.navigator.standalone === true) return true;
  } catch {
    /* ignore */
  }
  try {
    return win.matchMedia("(display-mode: standalone)").matches;
  } catch {
    return false;
  }
}
