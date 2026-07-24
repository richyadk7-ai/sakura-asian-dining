import { describe, expect, it } from "vitest";
import { restaurant, restaurantConfig } from "@/data/restaurant";
import { MAX_RESERVATION_GUESTS, MIN_RESERVATION_GUESTS, RESERVATION_TIME_SLOTS } from "@/lib/reservation-request";

describe("central restaurant configuration", () => {
  it("drives the public restaurant record and reservation limits", () => {
    expect(restaurant.nameEn).toBe(restaurantConfig.identity.nameEn);
    expect(restaurant.addressEn).toBe(restaurantConfig.location.addressEn);
    expect(restaurant.reservationPhone).toBe(restaurantConfig.contact.reservationPhone);
    expect(restaurant.seats).toBeNull();
    expect(MIN_RESERVATION_GUESTS).toBe(restaurantConfig.reservations.minimumGuests);
    expect(MAX_RESERVATION_GUESTS).toBe(restaurantConfig.reservations.maximumOnlineGuests);
    expect(RESERVATION_TIME_SLOTS).toBe(restaurantConfig.reservations.timeSlots);
  });

  it("keeps unresolved operational facts explicit instead of inventing a capacity", () => {
    expect(restaurantConfig.ownerVerificationRequired.length).toBeGreaterThan(0);
    expect(restaurantConfig.ownerVerificationRequired.join(" ")).toMatch(/telephone|opening hours|seat count|party size/i);
  });
});
