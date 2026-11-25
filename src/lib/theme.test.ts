import { describe, expect, it } from "vitest";
import { resolveTheme } from "./theme";

describe("appearance preference", () => {
  it("keeps an explicit light choice even on a dark device", () => {
    expect(resolveTheme("light", true)).toBe("light");
  });
  it("keeps an explicit dark choice even on a light device", () => {
    expect(resolveTheme("dark", false)).toBe("dark");
  });
  it("uses the device appearance when no valid choice was saved", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme("invalid", false)).toBe("light");
  });
});