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
    imageUrls: v.optional(v.array(v.string())),
    trophyCount: v.optional(v.number()),
    rareSkinCount: v.optional(v.number()),
    superRareSkinCount: v.optional(v.number()),
    epicSkinCount: v.optional(v.number()),
    mythicSkinCount: v.optional(v.number()),
    legendarySkinCount: v.optional(v.number()),
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
    stockReservedAt: v.optional(v.number()),
    paidAt: v.optional(v.number()),
    receiptEmailSendStartedAt: v.optional(v.number()),
    receiptEmailSentAt: v.optional(v.number()),
    receiptEmailError: v.optional(v.string()),
    adminPurchaseEmailSendStartedAt: v.optional(v.number()),
    adminPurchaseEmailSentAt: v.optional(v.number()),
    adminPurchaseEmailError: v.optional(v.string()),
    customerDeliveryEmailSendStartedAt: v.optional(v.number()),
    customerDeliveryEmailSentAt: v.optional(v.number()),
    customerDeliveryEmailError: v.optional(v.string()),
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

  chatMessages: defineTable({
    userId: v.optional(v.id("users")),
    authorName: v.string(),
    body: v.string(),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  supportTickets: defineTable({
    userId: v.id("users"),
    customerName: v.string(),
    customerEmail: v.optional(v.string()),
    assignedAdminId: v.optional(v.id("users")),
    status: v.union(v.literal("open"), v.literal("pending"), v.literal("closed")),
    lastMessagePreview: v.optional(v.string()),
    lastMessageAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId_status", ["userId", "status"])
    .index("by_status_lastMessageAt", ["status", "lastMessageAt"]),

  supportMessages: defineTable({
    ticketId: v.id("supportTickets"),
    senderId: v.id("users"),
    senderName: v.string(),
    senderRole: v.union(v.literal("customer"), v.literal("admin")),
    body: v.string(),
    createdAt: v.number(),
  }).index("by_ticketId_createdAt", ["ticketId", "createdAt"]),
});
