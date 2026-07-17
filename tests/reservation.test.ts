import { describe, expect, it } from "vitest";
import { buildTabelogReservationUrl } from "@/lib/reservation";

describe("official reservation handoff", () => {
  it("constructs the direct Tabelog booking endpoint with all required values", () => {
    expect(buildTabelogReservationUrl({ date: "2026-08-09", time: "19:30", guests: 4 })).toBe("https://tabelog.com/booking/form/new?member=4&rcd=13218334&visit_date=20260809&visit_time=1930&lid=yoyaku_rstdtl_side_calendar");
  });
  it("rejects malformed values instead of opening a generic listing", () => {
    expect(() => buildTabelogReservationUrl({ date: "09/08/2026", time: "7pm", guests: 0 })).toThrow();
  });
});
