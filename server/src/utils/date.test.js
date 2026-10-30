import { describe, expect, it } from "vitest";
import {
  getDateKey,
  isValidDateKey,
  legacyDateToIso,
  shiftDateKey,
} from "./date.js";

describe("date utilities", () => {
  it("returns a date key in the configured timezone", () => {
    expect(
      getDateKey(new Date("2026-10-30T02:00:00.000Z"), "America/Mexico_City")
    ).toBe("2026-10-29");
  });

  it("validates date keys", () => {
    expect(isValidDateKey("2026-10-29")).toBe(true);
    expect(isValidDateKey("2026-02-30")).toBe(false);
    expect(isValidDateKey("29/10/2026")).toBe(false);
  });

  it("shifts date keys across month boundaries", () => {
    expect(shiftDateKey("2026-10-29", -29)).toBe("2026-09-30");
    expect(shiftDateKey("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("converts legacy dd/mm/yyyy values", () => {
    expect(legacyDateToIso("29/10/2026")).toBe("2026-10-29T12:00:00.000Z");
    expect(legacyDateToIso("31/02/2026")).toBeNull();
  });
});
