import type { Metadata } from "next";

/** Linked only from /owner and shop admin — not the public marketing site. */
export const OWNER_WEB_MANIFEST_PATH = "/owner.webmanifest";

/**
 * Metadata override so "Add to Home Screen" from owner/admin opens `/owner`
 * (OwnerEntry → shop admin when logged in). Public pages keep `/site.webmanifest`.
 */
export const ownerPwaMetadata = {
  manifest: OWNER_WEB_MANIFEST_PATH,
  applicationName: "ClipperQ ร้านของฉัน",
  appleWebApp: {
    capable: true,
    title: "ClipperQ ร้านของฉัน",
    statusBarStyle: "black-translucent",
  },
} as const satisfies Partial<Metadata>;
