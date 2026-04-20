import { Id } from "../../../convex/_generated/dataModel";

const GUEST_CART_KEY = "ystore_guest_cart";
const GUEST_CART_EVENT = "guest-cart-updated";

export type GuestCartItem = {
  productId: Id<"products">;
  quantity: number;
};

function readRawCart(): GuestCartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(GUEST_CART_KEY) ?? "[]");
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((item) => typeof item?.productId === "string")
      .map((item) => ({
        productId: item.productId as Id<"products">,
        quantity: Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1))),
      }));
  } catch {
    return [];
  }
}

function writeCart(items: GuestCartItem[]) {
  window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(GUEST_CART_EVENT));
}

export function getGuestCart() {
  return readRawCart();
}

export function getGuestCartCount() {
  return readRawCart().reduce((sum, item) => sum + item.quantity, 0);
}

export function addGuestCartItem(productId: Id<"products">, quantity: number, stock: number) {
  const safeQuantity = Math.max(1, Math.min(stock, Math.floor(quantity)));
  const items = readRawCart();
  const existing = items.find((item) => item.productId === productId);

  if (existing) {
    existing.quantity = Math.min(stock, existing.quantity + safeQuantity);
  } else {
    items.push({ productId, quantity: safeQuantity });
  }

  writeCart(items);
}

export function updateGuestCartItem(productId: Id<"products">, quantity: number, stock: number) {
  if (quantity <= 0) {
    removeGuestCartItem(productId);
    return;
  }

  const items = readRawCart().map((item) =>
    item.productId === productId
      ? { ...item, quantity: Math.max(1, Math.min(stock, Math.floor(quantity))) }
      : item,
  );
  writeCart(items);
}

export function removeGuestCartItem(productId: Id<"products">) {
  writeCart(readRawCart().filter((item) => item.productId !== productId));
}

export function clearGuestCart() {
  writeCart([]);
}

export function onGuestCartChange(callback: () => void) {
  window.addEventListener(GUEST_CART_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(GUEST_CART_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
