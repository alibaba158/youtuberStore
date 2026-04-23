const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DISPLAY_NAME_REGEX = /^[A-Za-z0-9\u0590-\u05FF .,'_&()\/+-]+$/;
const PRICE_REGEX = /^\d+(?:\.\d{1,2})?$/;
const MAX_STOCK = 1_000_000;

export const ALLOWED_THEMES = [
  "default",
  "green-gold",
  "red-cream",
  "teal-brown",
  "pink-gray",
] as const;

type ThemeName = (typeof ALLOWED_THEMES)[number];

function fail(message: string): never {
  throw new Error(message);
}

function normalizeUnicode(value: string) {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim();
}

export function normalizeRequiredText(
  value: string,
  fieldName: string,
  maxLength: number,
) {
  const normalized = normalizeUnicode(value);
  if (!normalized) {
    fail(`${fieldName} is required`);
  }
  if (normalized.length > maxLength) {
    fail(`${fieldName} is too long`);
  }
  return normalized;
}

export function normalizeOptionalText(
  value: string | undefined,
  fieldName: string,
  maxLength: number,
) {
  if (value === undefined) {
    return undefined;
  }
  const normalized = normalizeUnicode(value);
  if (!normalized) {
    return undefined;
  }
  if (normalized.length > maxLength) {
    fail(`${fieldName} is too long`);
  }
  return normalized;
}

export function normalizeEmail(value: string) {
  const email = normalizeRequiredText(value, "Email", 254).toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    fail("Invalid email address");
  }
  return email;
}

export function normalizeDisplayName(value: string) {
  const name = normalizeRequiredText(value, "Name", 80);
  if (!DISPLAY_NAME_REGEX.test(name)) {
    fail("Name contains unsupported characters");
  }
  return name;
}

export function validatePasswordStrength(password: string) {
  if (password.length < 4) {
    fail("Password must be at least 4 characters");
  }
}

export function normalizeSlug(value: string) {
  const slug = normalizeRequiredText(value, "Slug", 64).toLowerCase();
  if (!SLUG_REGEX.test(slug)) {
    fail("Slug must contain only lowercase letters, numbers, and hyphens");
  }
  return slug;
}

export function normalizePrice(value: string) {
  const normalized = normalizeRequiredText(value, "Price", 16);
  if (!PRICE_REGEX.test(normalized)) {
    fail("Invalid price format");
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1_000_000) {
    fail("Price is out of range");
  }
  return parsed.toFixed(2);
}

export function normalizeStock(value: number) {
  if (!Number.isInteger(value) || value < 0 || value > MAX_STOCK) {
    fail("Stock is out of range");
  }
  return value;
}

export function normalizeCartQuantity(value: number) {
  if (!Number.isInteger(value) || value < 1 || value > 100) {
    fail("Quantity is out of range");
  }
  return value;
}

export function normalizeSortOrder(value: number | undefined) {
  const normalized = value ?? 0;
  if (!Number.isInteger(normalized) || normalized < 0 || normalized > 10_000) {
    fail("Sort order is out of range");
  }
  return normalized;
}

export function normalizeSafeImageUrl(value: string | undefined) {
  if (value === undefined) {
    return undefined;
  }
  const normalized = normalizeUnicode(value);
  if (!normalized) {
    return undefined;
  }
  if (normalized.startsWith("data:image/")) {
    if (normalized.length > 2_000_000) {
      fail("Image is too large");
    }
    return normalized;
  }
  if (normalized.length > 4_096) {
    fail("Image URL is too long");
  }
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      fail("Image URL must use http or https");
    }
    return parsed.toString();
  } catch {
    fail("Invalid image URL");
  }
}

export function normalizeTheme(value: string): ThemeName {
  if ((ALLOWED_THEMES as readonly string[]).includes(value)) {
    return value as ThemeName;
  }
  fail("Unsupported theme");
}
