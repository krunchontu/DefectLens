import { describe, it, expect } from "vitest";
import { getWeekStart } from "../src/weekBucket";

describe("getWeekStart", () => {
  it("returns the same Monday when given a Monday", () => {
    // 2024-01-08 is a Monday
    expect(getWeekStart(new Date("2024-01-08T12:00:00Z"))).toBe("2024-01-08");
  });

  it("returns the previous Monday when given a Tuesday", () => {
    // 2024-01-09 is a Tuesday
    expect(getWeekStart(new Date("2024-01-09T12:00:00Z"))).toBe("2024-01-08");
  });

  it("returns the previous Monday when given a Wednesday", () => {
    // 2024-01-10 is a Wednesday
    expect(getWeekStart(new Date("2024-01-10T12:00:00Z"))).toBe("2024-01-08");
  });

  it("returns the previous Monday when given a Thursday", () => {
    // 2024-01-11 is a Thursday
    expect(getWeekStart(new Date("2024-01-11T12:00:00Z"))).toBe("2024-01-08");
  });

  it("returns the previous Monday when given a Friday", () => {
    // 2024-01-12 is a Friday
    expect(getWeekStart(new Date("2024-01-12T12:00:00Z"))).toBe("2024-01-08");
  });

  it("returns the previous Monday when given a Saturday", () => {
    // 2024-01-13 is a Saturday
    expect(getWeekStart(new Date("2024-01-13T12:00:00Z"))).toBe("2024-01-08");
  });

  it("returns the previous Monday when given a Sunday", () => {
    // 2024-01-14 is a Sunday
    expect(getWeekStart(new Date("2024-01-14T12:00:00Z"))).toBe("2024-01-08");
  });

  it("handles month boundaries correctly", () => {
    // 2024-02-01 is a Thursday, Monday is 2024-01-29
    expect(getWeekStart(new Date("2024-02-01T00:00:00Z"))).toBe("2024-01-29");
  });

  it("handles year boundaries correctly", () => {
    // 2024-01-01 is a Monday
    expect(getWeekStart(new Date("2024-01-01T00:00:00Z"))).toBe("2024-01-01");
    // 2023-12-31 is a Sunday, Monday is 2023-12-25
    expect(getWeekStart(new Date("2023-12-31T23:59:59Z"))).toBe("2023-12-25");
  });

  it("handles dates at start of day", () => {
    expect(getWeekStart(new Date("2024-03-15T00:00:00Z"))).toBe("2024-03-11");
  });

  it("handles dates at end of day", () => {
    // Same week as above (Friday)
    expect(getWeekStart(new Date("2024-03-15T23:59:59Z"))).toBe("2024-03-11");
  });
});
