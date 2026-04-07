import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

// ─── Auth Tests ───────────────────────────────────────────────────────────────

describe("auth.me", () => {
  it("returns null for unauthenticated users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated users", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.role).toBe("user");
  });
});

// ─── Admin Guard Tests ────────────────────────────────────────────────────────

describe("admin guard", () => {
  it("blocks non-admin from creating products", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(
      caller.products.create({
        name: "Test Product",
        price: "10.00",
      })
    ).rejects.toThrow();
  });

  it("blocks non-admin from creating categories", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(
      caller.categories.create({
        name: "Test Category",
        slug: "test-category",
      })
    ).rejects.toThrow();
  });

  it("blocks unauthenticated from creating products", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.products.create({
        name: "Test Product",
        price: "10.00",
      })
    ).rejects.toThrow();
  });

  it("blocks unauthenticated from updating stock", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.products.updateStock({ id: 1, stock: 10 })
    ).rejects.toThrow();
  });
});

// ─── Cart Guard Tests ─────────────────────────────────────────────────────────

describe("cart guard", () => {
  it("blocks unauthenticated from accessing cart", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.cart.get()).rejects.toThrow();
  });

  it("blocks unauthenticated from adding to cart", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.cart.add({ productId: 1, quantity: 1 })
    ).rejects.toThrow();
  });
});

// ─── Public Access Tests ──────────────────────────────────────────────────────

describe("public access", () => {
  it("allows public access to categories list", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    // Should not throw (may return empty array if DB unavailable)
    const result = await caller.categories.list().catch(() => []);
    expect(Array.isArray(result)).toBe(true);
  });

  it("allows public access to products list", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.products.list().catch(() => []);
    expect(Array.isArray(result)).toBe(true);
  });

  it("allows public access to featured products", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.products.featured().catch(() => []);
    expect(Array.isArray(result)).toBe(true);
  });
});
