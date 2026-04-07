import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
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
  }).index("by_categoryId", ["categoryId"]),

  cartItems: defineTable({
    userId: v.string(),
    productId: v.id("products"),
    quantity: v.number(),
  }).index("by_userId", ["userId"]),

  userPreferences: defineTable({
    userId: v.string(),
    theme: v.string(),
  }).index("by_userId", ["userId"]),
});
