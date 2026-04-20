import { describe, expect, it } from "vitest";
import {
  normalizeCartQuantity,
  normalizeEmail,
  normalizePrice,
  normalizeSafeImageUrl,
  normalizeSlug,
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
});
