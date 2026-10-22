import type { MetadataRoute } from "next";

/** Disallow capture/review preview routes from crawlers (pages also set noindex). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/preview/", "/preview"],
    },
  };
}
