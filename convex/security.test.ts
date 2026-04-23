import { describe, expect, it } from "vitest";
import {
  normalizeCartQuantity,
  normalizeEmail,
  normalizePrice,
  normalizeSafeImageUrl,
  normalizeSlug,
  normalizeStock,
  normalizeTheme,
  validatePasswordStrength,
} from "./security";

describe("security helpers", () => {
  it("normalizes valid email addresses", () => {
    expect(normalizeEmail(" Test@Example.com ")).toBe("test@example.com");
  });

  it("rejects very short passwords", () => {
    expect(() => validatePasswordStrength("123")).toThrow();
  });

  it("accepts simple passwords", () => {
    expect(() => validatePasswordStrength("1234")).not.toThrow();
  });

  it("rejects invalid slugs", () => {
    expect(() => normalizeSlug("Bad Slug")).toThrow();
  });

  it("normalizes decimal prices", () => {
    expect(normalizePrice("12.5")).toBe("12.50");
  });

  it("rejects non-http image urls", () => {
    expect(() => normalizeSafeImageUrl("javascript:alert(1)")).toThrow();
  });

  it("accepts whitelisted themes", () => {
    expect(normalizeTheme("default")).toBe("default");
  });

  it("rejects zero cart quantity", () => {
    expect(() => normalizeCartQuantity(0)).toThrow();
  });

  it("accepts large stock counts within range", () => {
    expect(normalizeStock(250_000)).toBe(250_000);
  });

  it("rejects stock counts above the max range", () => {
    expect(() => normalizeStock(1_000_001)).toThrow("Stock is out of range");
  });
});
