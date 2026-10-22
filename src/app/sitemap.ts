import type { MetadataRoute } from "next";

/**
 * Public URLs only — never include `/preview/*` (capture routes; gated + noindex).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://barber-q-pi.vercel.app";
  return [
    {
      url: `${base}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
