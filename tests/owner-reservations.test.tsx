import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OwnerReservationsDashboard } from "@/components/owner-reservations-dashboard";
import type { OwnerReservation } from "@/types";

afterEach(cleanup);

const base: OwnerReservation = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  reservation_reference: "SKR-20260720-A1B2C3",
  course_id: "welcome-party-course",
  customer_name: "Aiko Tanaka",
  customer_email: "aiko@example.com",
  customer_phone: "+81 90-1234-5678",
  reservation_date: "2026-07-20",
  reservation_time: "19:00:00",
  guest_count: 2,
  seating_preference: "no_preference",
  occasion: "birthday",
  allergies: null,
  special_requests: "Window side if possible",
  preferred_language: "ja",
  status: "pending",
  owner_notes: null,
  created_at: "2026-07-17T03:00:00.000Z",
  updated_at: "2026-07-17T03:00:00.000Z",
  confirmed_at: null,
  cancelled_at: null,
};

const confirmed: OwnerReservation = {
  ...base,
  id: "123e4567-e89b-42d3-a456-426614174001",
  reservation_reference: "SKR-20260721-D4E5F6",
  customer_name: "Ken Sato",
  customer_email: "ken@example.com",
  customer_phone: "+81 80-9876-5432",
  reservation_date: "2026-07-21",
  status: "confirmed",
};

describe("protected owner reservation dashboard", () => {
  it("highlights pending requests and searches customer data", () => {
    render(<OwnerReservationsDashboard reservations={[base, confirmed]} today="2026-07-20" />);
    expect(screen.getByText("1 pending · 2 total")).toBeVisible();
    fireEvent.change(screen.getByPlaceholderText("Name, phone, email or reference"), { target: { value: "aiko@example.com" } });
    expect(screen.getByRole("heading", { name: "Aiko Tanaka" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Ken Sato" })).not.toBeInTheDocument();
  });

  it("filters today and status views", () => {
    render(<OwnerReservationsDashboard reservations={[base, confirmed]} today="2026-07-20" />);
    fireEvent.click(screen.getByRole("button", { name: "today" }));
    expect(screen.getByRole("heading", { name: "Aiko Tanaka" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Ken Sato" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "all" }));
    fireEvent.change(screen.getByLabelText("Filter by status"), { target: { value: "confirmed" } });
    expect(screen.getByRole("heading", { name: "Ken Sato" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Aiko Tanaka" })).not.toBeInTheDocument();
  });

  it("shows the selected course in reservation details", () => {
    render(<OwnerReservationsDashboard reservations={[base]} today="2026-07-20" />);
    expect(screen.getByText("Welcome & Farewell Party: 8 Dishes, Unlimited Naan & Rice, 120-Minute Drink Plan")).toBeInTheDocument();
  });
});
