import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    sortOrder: v.number(),
  }).index("by_slug", ["slug"]),

  products: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    deliveryContent: v.optional(v.string()),
    price: v.string(),
    imageUrl: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    stock: v.number(),
    isActive: v.boolean(),
    isFeatured: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_categoryId", ["categoryId"]),

  orders: defineTable({
    userId: v.optional(v.id("users")),
    customerEmail: v.string(),
    customerName: v.string(),
    items: v.array(
      v.object({
        productId: v.id("products"),
        name: v.string(),
        imageUrl: v.optional(v.string()),
        price: v.string(),
        quantity: v.number(),
        deliveryContent: v.optional(v.string()),
      }),
    ),
    subtotal: v.string(),
    paymentMethod: v.union(v.literal("bit"), v.literal("stripe")),
    orderStatus: v.union(
      v.literal("awaiting_payment"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("canceled"),
    ),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("configuration_required"),
      v.literal("redirect_required"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("expired"),
      v.literal("canceled"),
    ),
    bitPaymentId: v.optional(v.string()),
    bitPaymentProduct: v.optional(v.string()),
    bitRedirectUrl: v.optional(v.string()),
    bitTransactionStatus: v.optional(v.string()),
    bitPsuId: v.optional(v.string()),
    bitPsuIdType: v.optional(v.string()),
    bitState: v.optional(v.string()),
    bitCodeVerifier: v.optional(v.string()),
    stripeCheckoutSessionId: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
    paidAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  cartItems: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    quantity: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_productId", ["userId", "productId"]),

  userProfiles: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("admin")),
    theme: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),
});
