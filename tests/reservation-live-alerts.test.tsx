import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReservationLiveAlerts } from "@/components/reservation-live-alerts";

const realtime = vi.hoisted(() => ({
  handler: null as null | ((event: { new: Record<string, unknown> }) => void),
  pollRows: [] as Record<string, unknown>[],
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
    const query = {
      select: () => query,
      order: () => query,
      limit: () => query,
      gt: () => query,
      then: (resolve: (value: { data: Record<string, unknown>[]; error: null }) => unknown) => Promise.resolve({ data: realtime.pollRows, error: null }).then(resolve),
    };
    return { channel: () => channel, removeChannel: realtime.removeChannel, from: () => query };
  },
}));

afterEach(() => {
  cleanup();
  realtime.handler = null;
  realtime.pollRows = [];
  realtime.refresh.mockClear();
  realtime.removeChannel.mockClear();
  delete (window as typeof window & { __sakuraReservationAudio?: unknown }).__sakuraReservationAudio;
  vi.useRealTimers();
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

  it("keeps a testable loud chime control after sound is enabled", async () => {
    const setValueAtTime = vi.fn();
    const exponentialRampToValueAtTime = vi.fn();
    const connect = vi.fn();
    class AudioContextMock {
      currentTime = 0;
      state = "running";
      destination = {};
      close = vi.fn();
      resume = vi.fn();
      createDynamicsCompressor = () => ({ threshold: { setValueAtTime }, knee: { setValueAtTime }, ratio: { setValueAtTime }, attack: { setValueAtTime }, release: { setValueAtTime }, connect });
      createGain = () => ({ gain: { setValueAtTime, exponentialRampToValueAtTime }, connect });
      createOscillator = () => ({ type: "sine", frequency: { setValueAtTime }, connect, start: vi.fn(), stop: vi.fn() });
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: AudioContextMock });
    render(<ReservationLiveAlerts />);
    fireEvent.click(screen.getByRole("button", { name: "Enable loud chime" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Test loud chime" })).toBeVisible());
    expect(exponentialRampToValueAtTime).toHaveBeenCalledWith(0.9, 0.025);
    fireEvent.click(screen.getByRole("button", { name: "Test loud chime" }));
    expect(exponentialRampToValueAtTime).toHaveBeenCalledTimes(44);
  });

  it("uses the protected polling fallback to ring when realtime misses an insert", async () => {
    vi.useFakeTimers();
    const oscillatorStart = vi.fn();
    const setValueAtTime = vi.fn();
    const context = {
      currentTime: 0,
      state: "running",
      destination: {},
      resume: vi.fn(),
      createDynamicsCompressor: () => ({ threshold: { setValueAtTime }, knee: { setValueAtTime }, ratio: { setValueAtTime }, attack: { setValueAtTime }, release: { setValueAtTime }, connect: vi.fn() }),
      createGain: () => ({ gain: { setValueAtTime, exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn() }),
      createOscillator: () => ({ type: "sine", frequency: { setValueAtTime }, connect: vi.fn(), start: oscillatorStart, stop: vi.fn() }),
    };
    (window as typeof window & { __sakuraReservationAudio?: unknown }).__sakuraReservationAudio = { context, enabled: true };
    render(<ReservationLiveAlerts initialLatestCreatedAt="2026-07-17T10:00:00.000Z" />);
    await act(async () => { await Promise.resolve(); });
    realtime.pollRows = [{
      id: "123e4567-e89b-42d3-a456-426614174001",
      reservation_reference: "SKR-20260720-D4E5F6",
      customer_name: "Polling Fallback Test",
      reservation_date: "2026-07-20",
      reservation_time: "20:00:00",
      guest_count: 3,
      created_at: "2026-07-17T10:01:00.000Z",
    }];
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(screen.getByText("Polling Fallback Test")).toBeVisible();
    expect(oscillatorStart).toHaveBeenCalledTimes(10);
    expect(realtime.refresh).toHaveBeenCalledOnce();
  });
});
