"use client";

import { BookingSuccess } from "@/components/customer/BookingSuccess";
import { ShopSlugProvider } from "@/lib/shop/shop-slug-context";
import type { Appointment, Barber } from "@/types/booking";

const DEMO_BARBER: Barber = {
  id: "33333333-3333-4333-8333-333333333333",
  name: "นัท",
  slot_duration_minutes: 60,
  off_days: [4],
  created_at: "2026-10-01T00:00:00.000Z",
  shop_id: "demo-shop",
  role: "barber",
  is_bookable: true,
  is_active: true,
  /** People photo comes from /sale/booking-success-barber.webp via marketing slot. */
  profile_image_url: null,
  show_profile_in_booking: true,
};

/** Friday 16 Oct 2026 11:30 Asia/Bangkok → fixed demo slot for screenshots. */
const DEMO_START = "2026-10-16T04:30:00.000Z";
const DEMO_END = "2026-10-16T05:30:00.000Z";

const DEMO_APPOINTMENT: Appointment = {
  id: "demo-success-preview",
  barber_id: DEMO_BARBER.id,
  customer_ref: "mock-demo-customer",
  customer_name: "Demo Guest",
  customer_phone: "0812345678",
  start_time: DEMO_START,
  end_time: DEMO_END,
  status: "confirmed",
  created_at: "2026-10-15T10:00:00.000Z",
  reminder_lead_minutes: null,
};

export function BookingSuccessPreview() {
  return (
    <ShopSlugProvider shopSlug="phinxstudio">
      <main className="min-h-dvh bg-zinc-950 text-zinc-50">
        <div className="mx-auto w-full max-w-[390px] border-x border-zinc-900">
          <BookingSuccess
            appointment={DEMO_APPOINTMENT}
            barberName="นัท"
            shopName="BarberQx Demo"
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
