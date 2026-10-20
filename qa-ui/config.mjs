/** @typedef {'iphone' | 'ipad' | 'desktop'} ViewportId */

export const DEFAULT_BASE_URL = "https://barberq-qa.vercel.app";
export const SHOP_SLUG = "barberqpilottest";

export const PRODUCTION_HOSTS = new Set([
  "barber-q-pi.vercel.app",
  "barber-q.vercel.app",
  "www.barber-q.vercel.app",
]);

/** @type {Record<ViewportId, { name: string; width: number; height: number; isMobile: boolean; hasTouch: boolean; userAgent?: string }>} */
export const VIEWPORTS = {
  iphone: {
    name: "iPhone 390×844",
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  },
  ipad: {
    name: "iPad 1024×1366",
    width: 1024,
    height: 1366,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  },
  desktop: {
    name: "Desktop 1440×900",
    width: 1440,
    height: 900,
    isMobile: false,
    hasTouch: false,
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
};

export const LATENCY_WARN_MS = 1000;
export const LATENCY_FAIL_MS = 2500;
export const TAP_MIN_PX = 44;

export const RAW_ENUM_STRINGS = [
  "manual",
  "automatic",
  "pending",
  "active",
  "inactive",
  "owner",
  "manager",
  "barber",
  "super_admin",
  "walk_in",
  "no_show",
  "confirmed",
];

/** Destructive / mutation controls — inspect styles only, never click. */
export const DESTRUCTIVE_TEXT_RE =
  /ลบ|ยกเลิก|reset|delete|remove|unlink|revoke|deactivate|ทำลาย|รีเซ็ต|ปิดใช้งาน/i;

/**
 * @param {string} shop
 * @returns {{ id: string; path: string; group: 'public' | 'admin' | 'platform'; auth?: boolean }[]}
 */
export function discoverRoutes(shop = SHOP_SLUG) {
  return [
    { id: "sales-home", path: "/", group: "platform" },
    { id: "trial", path: "/trial", group: "platform" },
    { id: "pilot", path: "/pilot", group: "platform" },
    { id: "guide", path: "/guide", group: "platform" },

    { id: "booking-home", path: `/${shop}`, group: "public" },
    { id: "bookings", path: `/${shop}/bookings`, group: "public" },
    { id: "qr-queue", path: `/${shop}/q`, group: "public" },
    { id: "qr-queue-me", path: `/${shop}/q/me`, group: "public" },

    { id: "admin-login", path: `/${shop}/admin/login`, group: "admin" },
    { id: "admin-today", path: `/${shop}/admin`, group: "admin", auth: true },
    { id: "admin-team", path: `/${shop}/admin/staff`, group: "admin", auth: true },
    { id: "admin-summary", path: `/${shop}/admin/stats`, group: "admin", auth: true },
    { id: "admin-schedule", path: `/${shop}/admin/my-schedule`, group: "admin", auth: true },
    { id: "admin-settings", path: `/${shop}/admin/settings`, group: "admin", auth: true },
    {
      id: "admin-notifications",
      path: `/${shop}/admin/settings/notifications`,
      group: "admin",
      auth: true,
    },
    {
      id: "admin-services",
      path: `/${shop}/admin/settings/services`,
      group: "admin",
      auth: true,
    },
    { id: "admin-line", path: `/${shop}/admin/settings/line`, group: "admin", auth: true },
    {
      id: "admin-qr-queue-settings",
      path: `/${shop}/admin/settings/qr-queue`,
      group: "admin",
      auth: true,
    },
    {
      id: "admin-reminders",
      path: `/${shop}/admin/settings/reminders`,
      group: "admin",
      auth: true,
    },
    { id: "admin-setup", path: `/${shop}/admin/setup`, group: "admin", auth: true },
  ];
}
