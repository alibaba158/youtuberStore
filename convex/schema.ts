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
    price: v.string(),
    imageUrl: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    stock: v.number(),
    isActive: v.boolean(),
    isFeatured: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_categoryId", ["categoryId"]),

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
