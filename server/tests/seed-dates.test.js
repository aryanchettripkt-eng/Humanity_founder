import { describe, expect, it } from "vitest";
import { resolveWhen, snapToWorkingHours, toEntity } from "../src/seed/seed.js";

const TZ = "Asia/Kolkata";
// Saturday 14 Nov 2026, 10:00 IST
const NOW = new Date("2026-11-14T04:30:00Z");

describe("seed dates", () => {
  it("resolves a weekday to the next occurrence in the client time zone", () => {
    expect(
      resolveWhen({ weekday: "fri", at: "17:00" }, TZ, NOW).toISOString(),
    ).toBe("2026-11-20T11:30:00.000Z");
    // Same weekday as today means next week, not today.
    expect(
      resolveWhen({ weekday: "sat", at: "09:00" }, TZ, NOW).toISOString(),
    ).toBe("2026-11-21T03:30:00.000Z");
  });

  it("resolves relative days and calendar dates", () => {
    expect(resolveWhen({ inDays: 1, at: "17:00" }, TZ, NOW).toISOString()).toBe(
      "2026-11-15T11:30:00.000Z",
    );
    expect(
      resolveWhen({ date: "11-19", at: "17:00" }, TZ, NOW).toISOString(),
    ).toBe("2026-11-19T11:30:00.000Z");
    expect(
      resolveWhen({ date: "01-05", at: "09:00" }, TZ, NOW).toISOString(),
    ).toBe("2027-01-05T03:30:00.000Z");
  });

  it("handles daylight saving zones", () => {
    // 2026-11-01 is the US DST switch; Friday 20 Nov 17:00 PST = 01:00Z next day.
    expect(
      resolveWhen(
        { weekday: "fri", at: "17:00" },
        "America/Los_Angeles",
        NOW,
      ).toISOString(),
    ).toBe("2026-11-21T01:00:00.000Z");
  });

  it("snaps relative times to the half hour within working hours", () => {
    // 01:33 IST -> 09:00 IST
    expect(
      snapToWorkingHours(new Date("2026-11-14T20:03:00Z"), TZ).toISOString(),
    ).toBe("2026-11-15T03:30:00.000Z");
    // 23:33 IST -> 18:00 IST
    expect(
      snapToWorkingHours(new Date("2026-11-14T18:03:00Z"), TZ).toISOString(),
    ).toBe("2026-11-14T12:30:00.000Z");
    // 14:20 IST -> 14:30 IST
    expect(
      snapToWorkingHours(new Date("2026-11-14T08:50:00Z"), TZ).toISOString(),
    ).toBe("2026-11-14T09:00:00.000Z");
  });

  it("keeps the duration when building an entity", () => {
    const e = toEntity(
      {
        type: "meeting",
        title: "Coffee",
        when: { weekday: "wed", at: "09:30" },
        durationMins: 60,
      },
      TZ,
    );
    expect(e.endsAt.getTime() - e.startsAt.getTime()).toBe(3600000);
    expect(e).not.toHaveProperty("when");
    expect(e).not.toHaveProperty("durationMins");
  });
});
