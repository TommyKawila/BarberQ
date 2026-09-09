import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { barberInitials, customerBarberPhotoUrl } from "@/lib/barber/barber-avatar";
import { formatOffDaysSummary } from "@/lib/barber/schedule-summary";
import { dictionary } from "@/lib/i18n/dictionary";
import { memoryStore } from "@/lib/data/memory-store";
import { listBookableBarbers } from "@/lib/services/booking-service";

describe("barber edit profile", () => {
  it("barberInitials uses first and last name parts", () => {
    assert.equal(barberInitials("Somchai Jaidee"), "SJ");
    assert.equal(barberInitials("Ann"), "AN");
    assert.equal(barberInitials(""), "?");
  });

  it("customer hides photo when show_profile_in_booking is false", () => {
    const url = customerBarberPhotoUrl({
      profile_image_url: "https://example.com/p.png",
      show_profile_in_booking: false,
    });
    assert.equal(url, null);
  });

  it("customer hides photo when no image URL", () => {
    const url = customerBarberPhotoUrl({
      profile_image_url: null,
      show_profile_in_booking: true,
    });
    assert.equal(url, null);
  });

  it("customer shows photo when flag and URL set", () => {
    const url = customerBarberPhotoUrl({
      profile_image_url: "https://example.com/p.png",
      show_profile_in_booking: true,
    });
    assert.equal(url, "https://example.com/p.png");
  });

  it("updateBarber saves profile fields", async () => {
    const shop = await memoryStore.createShop({
      name: "Profile Shop",
      ownerLineId: "U-profile-owner",
      ownerName: "Owner",
      subscriptionMonths: 1,
    });
    const barber = await memoryStore.createBarber({ shopId: shop.id, name: "Photo Barber" });
    const updated = await memoryStore.updateBarber(barber.id, {
      profileImageUrl: "https://cdn.example/barber.png",
      showProfileInBooking: true,
      name: "Photo Barber Pro",
    });
    assert.equal(updated.profile_image_url, "https://cdn.example/barber.png");
    assert.equal(updated.show_profile_in_booking, true);
    assert.equal(updated.name, "Photo Barber Pro");
  });

  it("inactive and non-bookable barbers hidden from booking list", async () => {
    const shop = await memoryStore.createShop({
      name: "Bookable Shop",
      ownerLineId: "U-bookable-owner",
      ownerName: "Owner",
      subscriptionMonths: 1,
    });
    const active = await memoryStore.createBarber({ shopId: shop.id, name: "Active" });
    const closed = await memoryStore.createBarber({
      shopId: shop.id,
      name: "Closed",
      isBookable: false,
    });
    await memoryStore.deactivateBarber(shop.id, closed.id);
    const bookable = await listBookableBarbers(shop.id);
    assert.ok(bookable.some((b) => b.id === active.id));
    assert.ok(!bookable.some((b) => b.id === closed.id));
  });

  it("schedule title copy uses barber name placeholder", () => {
    const title = dictionary.th["admin.scheduleTitleFor"].replace("{name}", "สมชาย");
    assert.ok(title.includes("สมชาย"));
    assert.equal(dictionary.th["admin.editBarberTitle"], "แก้ไขช่าง");
  });

  it("off days summary formats weekday labels", () => {
    const summary = formatOffDaysSummary([0, 6], (key) => dictionary.th[key]);
    assert.ok(summary.includes("อาทิตย์"));
    assert.ok(summary.includes("เสาร์"));
  });
});
