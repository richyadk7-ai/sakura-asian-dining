import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReservationLiveAlerts } from "@/components/reservation-live-alerts";

const realtime = vi.hoisted(() => ({
  handler: null as null | ((event: { new: Record<string, unknown> }) => void),
  refresh: vi.fn(),
  removeChannel: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: realtime.refresh }) }));
vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => {
    const channel = {
      on: (_type: string, _filter: unknown, handler: typeof realtime.handler) => {
        realtime.handler = handler;
        return channel;
      },
      subscribe: (handler: (status: string) => void) => {
        handler("SUBSCRIBED");
        return channel;
      },
    };
    return { channel: () => channel, removeChannel: realtime.removeChannel };
  },
}));

afterEach(() => {
  cleanup();
  realtime.handler = null;
  realtime.refresh.mockClear();
  realtime.removeChannel.mockClear();
});

describe("live owner reservation alerts", () => {
  it("shows a live popup and refreshes the queue for a valid new reservation", async () => {
    render(<ReservationLiveAlerts />);
    await waitFor(() => expect(screen.getByText("Live reservations")).toBeVisible());

    act(() => realtime.handler?.({ new: {
      id: "123e4567-e89b-42d3-a456-426614174000",
      reservation_reference: "SKR-20260720-A1B2C3",
      customer_name: "Aiko Tanaka",
      reservation_date: "2026-07-20",
      reservation_time: "19:00:00",
      guest_count: 4,
    } }));

    expect(screen.getByText("New reservation request")).toBeVisible();
    expect(screen.getByText("Aiko Tanaka")).toBeVisible();
    expect(screen.getByText("2026-07-20 · 19:00 · 4 guests")).toBeVisible();
    expect(screen.getByRole("link", { name: "SKR-20260720-A1B2C3 · Open request" })).toHaveAttribute("href", "#reservation-123e4567-e89b-42d3-a456-426614174000");
    expect(realtime.refresh).toHaveBeenCalledOnce();
  });

  it("ignores malformed realtime payloads", async () => {
    render(<ReservationLiveAlerts />);
    await waitFor(() => expect(screen.getByText("Live reservations")).toBeVisible());
    act(() => realtime.handler?.({ new: { id: "broken" } }));
    expect(screen.queryByText("New reservation request")).not.toBeInTheDocument();
    expect(realtime.refresh).not.toHaveBeenCalled();
  });
});
