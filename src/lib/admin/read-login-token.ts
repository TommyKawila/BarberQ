export function readLoginTokenFromUrl(): string | null {
  if (typeof window === "undefined") return null;

  const url = new URL(window.location.href);
  const fromQuery = url.searchParams.get("token")?.trim();
  if (fromQuery) {
    url.searchParams.delete("token");
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(null, "", next || url.pathname);
    return fromQuery;
  }

  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const fromHash = params.get("token")?.trim();
  if (!fromHash) return null;
  window.history.replaceState(null, "", url.pathname + url.search);
  return fromHash;
}
