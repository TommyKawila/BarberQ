"use client";

import { BookingSuccess } from "@/components/customer/BookingSuccess";
import { ShopSlugProvider } from "@/lib/shop/shop-slug-context";
import type { Appointment, Barber } from "@/types/booking";

/** Matches HOW_DEMO_BOOKING / ClipperQ Demo sample barber เจ · Jay. */
const DEMO_BARBER: Barber = {
  id: "33333333-3333-4333-8333-333333333333",
  name: "เจ",
  slot_duration_minutes: 30,
  off_days: [],
  created_at: "2026-10-01T00:00:00.000Z",
  shop_id: "demo-shop",
  role: "barber",
  is_bookable: true,
  is_active: true,
  profile_image_url: null,
  show_profile_in_booking: true,
};

/** Wed 28 Oct 2026 21:30–22:00 Asia/Bangkok (เจ · 21:30 demo). */
const DEMO_START = "2026-10-28T14:30:00.000Z";
const DEMO_END = "2026-10-28T15:00:00.000Z";

const DEMO_APPOINTMENT: Appointment = {
  id: "demo-success-preview",
  barber_id: DEMO_BARBER.id,
  customer_ref: "mock-demo-customer",
  /** No personal name/phone on the success UI — keep refs generic. */
  customer_name: "",
  customer_phone: null,
  start_time: DEMO_START,
  end_time: DEMO_END,
  status: "confirmed",
  created_at: "2026-10-28T10:00:00.000Z",
  reminder_lead_minutes: 30,
};

export function BookingSuccessPreview() {
  return (
    <ShopSlugProvider shopSlug="clipperqdemo">
      <main className="min-h-dvh bg-zinc-950 text-zinc-50">
        <div className="mx-auto w-full max-w-[390px] border-x border-zinc-900">
          <BookingSuccess
            appointment={DEMO_APPOINTMENT}
            barberName="เจ"
            shopName="ClipperQ Demo"
            barber={DEMO_BARBER}
            friendship="friend"
            useMarketingAvatarSlot
            onBackToShop={() => {
              /* preview only */
            }}
          />
        </div>
      </main>
    </ShopSlugProvider>
  );
}
