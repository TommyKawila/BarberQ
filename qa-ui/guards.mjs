import { PRODUCTION_HOSTS } from "./config.mjs";

/**
 * Hard-fail if the crawl target is Production.
 * @param {string} baseUrl
 */
export function assertSafeBaseUrl(baseUrl) {
  let url;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new Error(`QA crawl refused: invalid base URL "${baseUrl}"`);
  }
  const host = url.hostname.toLowerCase();
  if (PRODUCTION_HOSTS.has(host)) {
    throw new Error(
      `QA crawl REFUSED: base URL is Production (${host}). Use barberq-qa only.`,
    );
  }
  // Catch bare product host aliases
  if (host === "barber-q" || /^barber-q(\.|$)/.test(host)) {
    if (!host.includes("qa")) {
      throw new Error(
        `QA crawl REFUSED: base URL looks like Production (${host}).`,
      );
    }
  }
  return url;
}
