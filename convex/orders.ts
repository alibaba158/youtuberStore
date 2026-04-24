import { getAuthUserId } from "@convex-dev/auth/server";
import {
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { v } from "convex/values";
import {
  normalizeCartQuantity,
  normalizeEmail,
  normalizeOptionalText,
  normalizePrice,
  normalizeRequiredText,
  normalizeStock,
} from "./security";

function parseAdminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function getViewer(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    return null;
  }

  const authUser = await ctx.db.get(userId);
  if (!authUser) {
    return null;
  }

  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .unique();

  const adminEmails = parseAdminEmails();
  const fallbackRole = adminEmails.has((authUser.email ?? "").toLowerCase())
    ? "admin"
    : "user";

  return {
    authUser,
    user: {
      _id: authUser._id,
      email: authUser.email ?? "",
      name: authUser.name ?? authUser.email ?? "User",
      role: profile?.role ?? fallbackRole,
    },
  };
}

async function requireViewer(ctx: any) {
  const viewer = await getViewer(ctx);
  if (!viewer) {
    throw new Error("Authentication required");
  }
  return viewer;
}

function isBitConfigured() {
  return Boolean(
    process.env.BIT_CLIENT_ID &&
      process.env.BIT_REDIRECT_URI &&
      process.env.BIT_RECEIVER_NAME &&
      process.env.BIT_RECEIVER_MSISDN &&
      process.env.BIT_TPP_SIGNATURE_CERT_BASE64 &&
      process.env.BIT_TPP_PRIVATE_KEY_PEM,
  );
}

function isStripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      process.env.APP_URL,
  );
}

const BIT_SUCCESS_STATUS = "ACSC";

function sanitizeOrderItems(items: any[], deliveryUnlocked: boolean) {
  return items.map((item) => ({
    ...item,
    deliveryContent: deliveryUnlocked ? item.deliveryContent : undefined,
  }));
}

function serializeOrder(order: any, opts?: { includeSensitiveBitState?: boolean }) {
  const deliveryUnlocked = order.orderStatus === "paid";
  return {
    _id: order._id,
    _creationTime: order._creationTime,
    userId: order.userId,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    items: sanitizeOrderItems(order.items, deliveryUnlocked),
    subtotal: order.subtotal,
    paymentMethod: order.paymentMethod,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    bitPaymentId: order.bitPaymentId,
    bitPaymentProduct: order.bitPaymentProduct,
    bitRedirectUrl: order.bitRedirectUrl,
    bitTransactionStatus: order.bitTransactionStatus,
    stripeCheckoutSessionId: order.stripeCheckoutSessionId,
    paidAt: order.paidAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    deliveryUnlocked,
    paymentConfigured: isStripeConfigured(),
    ...(opts?.includeSensitiveBitState
      ? {
          bitPsuId: order.bitPsuId,
          bitPsuIdType: order.bitPsuIdType,
          bitState: order.bitState,
          bitCodeVerifier: order.bitCodeVerifier,
        }
      : {}),
  };
}

type OrderSnapshotInput = {
  productId: any;
  quantity: number;
};

async function buildOrderSnapshotFromItems(ctx: any, sourceItems: OrderSnapshotInput[]) {
  if (sourceItems.length === 0) {
    throw new Error("Your cart is empty");
  }

  const mergedItems = new Map<any, number>();
  for (const item of sourceItems) {
    const quantity = normalizeCartQuantity(item.quantity);
    mergedItems.set(item.productId, (mergedItems.get(item.productId) ?? 0) + quantity);
  }

  const items = [];
  let subtotal = 0;

  for (const [productId, rawQuantity] of Array.from(mergedItems.entries())) {
    const quantity = normalizeCartQuantity(rawQuantity);
    const product = await ctx.db.get(productId);
    if (!product || !product.isActive) {
      throw new Error("One of the products in your cart is no longer available");
    }
    if (product.stock < quantity) {
      throw new Error(`Insufficient stock for ${product.name}`);
    }

    const price = normalizePrice(product.price);
    subtotal += Number(price) * quantity;
    items.push({
      productId: product._id,
      name: product.name,
      imageUrl: product.imageUrl,
      price,
      quantity,
      deliveryContent: normalizeOptionalText(
        product.deliveryContent,
        "Delivery content",
        5_000,
      ),
    });
  }

  return {
    items,
    subtotal: subtotal.toFixed(2),
    itemCount: items.reduce(
      (sum: number, item: { quantity: number }) => sum + item.quantity,
      0,
    ),
  };
}

async function buildOrderSnapshot(ctx: any, viewer: NonNullable<Awaited<ReturnType<typeof getViewer>>>) {
  const cartItems = await ctx.db
    .query("cartItems")
    .withIndex("by_userId", (q: any) => q.eq("userId", viewer.authUser._id))
    .collect();

  return buildOrderSnapshotFromItems(ctx, cartItems);
}

export const checkoutPreview = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const snapshot = await buildOrderSnapshot(ctx, viewer);

    return {
      customer: {
        email: viewer.user.email,
        name: viewer.user.name,
      },
      items: snapshot.items,
      subtotal: snapshot.subtotal,
      itemCount: snapshot.itemCount,
      paymentMethods: [
        {
          id: "stripe",
          name: "Stripe",
          description:
            "Secure Stripe Checkout payment flow with verified webhook confirmation before delivery.",
          enabled: isStripeConfigured(),
        },
      ],
      bitConfigured: isStripeConfigured(),
    };
  },
});

export const createOrderFromCart = mutation({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const snapshot = await buildOrderSnapshot(ctx, viewer);
    const now = Date.now();

    return ctx.db.insert("orders", {
      userId: viewer.authUser._id,
      customerEmail: viewer.user.email,
      customerName: viewer.user.name,
      items: snapshot.items,
      subtotal: snapshot.subtotal,
      paymentMethod: "stripe",
      orderStatus: "awaiting_payment",
      paymentStatus: isStripeConfigured() ? "pending" : "configuration_required",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const createGuestOrder = mutation({
  args: {
    items: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
      }),
    ),
    customerEmail: v.optional(v.string()),
    customerName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    const snapshot = await buildOrderSnapshotFromItems(ctx, args.items);
    const now = Date.now();

    if (viewer) {
      return ctx.db.insert("orders", {
        userId: viewer.authUser._id,
        customerEmail: viewer.user.email,
        customerName: viewer.user.name,
        items: snapshot.items,
        subtotal: snapshot.subtotal,
        paymentMethod: "stripe",
        orderStatus: "awaiting_payment",
        paymentStatus: isStripeConfigured() ? "pending" : "configuration_required",
        createdAt: now,
        updatedAt: now,
      });
    }

    const customerEmail = normalizeEmail(args.customerEmail ?? "");
    const customerName =
      normalizeOptionalText(args.customerName, "Customer name", 80) ??
      customerEmail;

    return ctx.db.insert("orders", {
      customerEmail,
      customerName,
      items: snapshot.items,
      subtotal: snapshot.subtotal,
      paymentMethod: "stripe",
      orderStatus: "awaiting_payment",
      paymentStatus: isStripeConfigured() ? "pending" : "configuration_required",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const orderById = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    const order = await ctx.db.get(args.id);
    if (!order) {
      return null;
    }

    const isGuestOrder = !order.userId;
    const isOwner = viewer ? order.userId === viewer.authUser._id : false;
    const isAdmin = viewer?.user.role === "admin";
    if (!isGuestOrder && !isOwner && !isAdmin) {
      throw new Error("Access denied");
    }

    return serializeOrder(order, { includeSensitiveBitState: Boolean(isAdmin) });
  },
});

export const myOrders = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_userId", (q) => q.eq("userId", viewer.authUser._id))
      .collect();

    return orders
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((order) => serializeOrder(order));
  },
});

export const saveBitPaymentStart = internalMutation({
  args: {
    orderId: v.id("orders"),
    paymentId: v.optional(v.string()),
    redirectUrl: v.optional(v.string()),
    state: v.optional(v.string()),
    codeVerifier: v.optional(v.string()),
    psuId: v.optional(v.string()),
    psuIdType: v.optional(v.string()),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("configuration_required"),
      v.literal("redirect_required"),
      v.literal("failed"),
    ),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    await ctx.db.patch(args.orderId, {
      bitPaymentId: normalizeOptionalText(args.paymentId, "Payment ID", 200),
      bitPaymentProduct: args.paymentId ? "fp" : order.bitPaymentProduct,
      bitRedirectUrl: normalizeOptionalText(
        args.redirectUrl,
        "Redirect URL",
        2_000,
      ),
      bitState: normalizeOptionalText(args.state, "State", 255),
      bitCodeVerifier: normalizeOptionalText(
        args.codeVerifier,
        "Code verifier",
        255,
      ),
      bitPsuId: normalizeOptionalText(args.psuId, "PSU ID", 64),
      bitPsuIdType: normalizeOptionalText(args.psuIdType, "PSU ID type", 32),
      paymentStatus: args.paymentStatus,
      updatedAt: Date.now(),
    });
  },
});

export const saveStripeCheckoutSession = internalMutation({
  args: {
    orderId: v.id("orders"),
    checkoutSessionId: v.string(),
    paymentIntentId: v.optional(v.string()),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("redirect_required"),
      v.literal("failed"),
    ),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    await ctx.db.patch(args.orderId, {
      stripeCheckoutSessionId: normalizeRequiredText(
        args.checkoutSessionId,
        "Stripe Checkout session ID",
        255,
      ),
      stripePaymentIntentId: normalizeOptionalText(
        args.paymentIntentId,
        "Stripe payment intent ID",
        255,
      ),
      paymentStatus: args.paymentStatus,
      updatedAt: Date.now(),
    });
  },
});

export const markOrderPaid = internalMutation({
  args: {
    orderId: v.id("orders"),
    paymentId: v.string(),
    transactionStatus: v.string(),
    confirmedAmount: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }
    if (order.orderStatus === "paid") {
      return true;
    }

    const paymentId = normalizeRequiredText(args.paymentId, "Payment ID", 200);
    const transactionStatus = normalizeRequiredText(
      args.transactionStatus,
      "Transaction status",
      16,
    ).toUpperCase();
    const confirmedAmount = normalizePrice(args.confirmedAmount);

    if (!order.bitPaymentId || order.bitPaymentId !== paymentId) {
      throw new Error("Payment ID does not match this order");
    }
    if (transactionStatus !== BIT_SUCCESS_STATUS) {
      throw new Error("Bit payment has not reached a verified success status");
    }
    if (confirmedAmount !== normalizePrice(order.subtotal)) {
      throw new Error("Paid amount does not match order total");
    }

    for (const item of order.items) {
      const product = await ctx.db.get(item.productId);
      if (!product) {
        throw new Error(`Product no longer exists: ${item.name}`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock to finalize ${item.name}`);
      }
    }

    for (const item of order.items) {
      const product = await ctx.db.get(item.productId);
      if (!product) {
        continue;
      }
      await ctx.db.patch(item.productId, {
        stock: normalizeStock(product.stock - item.quantity),
        updatedAt: Date.now(),
      });
    }

    const orderUserId = order.userId;
    if (orderUserId) {
      const cartItems = await ctx.db
        .query("cartItems")
        .withIndex("by_userId", (q) => q.eq("userId", orderUserId))
        .collect();

      for (const cartItem of cartItems) {
        const orderedItem = order.items.find(
          (item) => item.productId === cartItem.productId,
        );
        if (!orderedItem) {
          continue;
        }
        await ctx.db.delete(cartItem._id);
      }
    }

    await ctx.db.patch(args.orderId, {
      orderStatus: "paid",
      paymentStatus: "paid",
      bitTransactionStatus: transactionStatus,
      paidAt: Date.now(),
      updatedAt: Date.now(),
    });

    return true;
  },
});

export const markOrderPaymentFailed = internalMutation({
  args: {
    orderId: v.id("orders"),
    paymentStatus: v.union(
      v.literal("failed"),
      v.literal("expired"),
      v.literal("canceled"),
    ),
    transactionStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    await ctx.db.patch(args.orderId, {
      paymentStatus: args.paymentStatus,
      orderStatus:
        args.paymentStatus === "canceled" ? "canceled" : "failed",
      bitTransactionStatus: normalizeOptionalText(
        args.transactionStatus,
        "Transaction status",
        16,
      ),
      updatedAt: Date.now(),
    });

    return true;
  },
});

export const markOrderPaidFromStripe = internalMutation({
  args: {
    orderId: v.id("orders"),
    checkoutSessionId: v.string(),
    paymentIntentId: v.optional(v.string()),
    amountTotal: v.number(),
    currency: v.string(),
    paymentStatus: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }
    if (order.orderStatus === "paid") {
      return true;
    }

    const checkoutSessionId = normalizeRequiredText(
      args.checkoutSessionId,
      "Stripe Checkout session ID",
      255,
    );
    if (
      !order.stripeCheckoutSessionId ||
      order.stripeCheckoutSessionId !== checkoutSessionId
    ) {
      throw new Error("Stripe Checkout session does not match this order");
    }

    const paymentStatus = normalizeRequiredText(
      args.paymentStatus,
      "Stripe payment status",
      32,
    ).toLowerCase();
    if (paymentStatus !== "paid") {
      throw new Error("Stripe payment is not in a paid state");
    }

    const currency = normalizeRequiredText(args.currency, "Currency", 8).toLowerCase();
    if (currency !== "ils") {
      throw new Error("Unexpected Stripe currency");
    }

    const orderTotalAgorot = Math.round(Number(normalizePrice(order.subtotal)) * 100);
    if (!Number.isInteger(args.amountTotal) || args.amountTotal !== orderTotalAgorot) {
      throw new Error("Stripe paid amount does not match order total");
    }

    const paymentIntentId = normalizeOptionalText(
      args.paymentIntentId,
      "Stripe payment intent ID",
      255,
    );

    for (const item of order.items) {
      const product = await ctx.db.get(item.productId);
      if (!product) {
        throw new Error(`Product no longer exists: ${item.name}`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock to finalize ${item.name}`);
      }
    }

    for (const item of order.items) {
      const product = await ctx.db.get(item.productId);
      if (!product) {
        continue;
      }
      await ctx.db.patch(item.productId, {
        stock: normalizeStock(product.stock - item.quantity),
        updatedAt: Date.now(),
      });
    }

    const orderUserId = order.userId;
    if (orderUserId) {
      const cartItems = await ctx.db
        .query("cartItems")
        .withIndex("by_userId", (q) => q.eq("userId", orderUserId))
        .collect();

      for (const cartItem of cartItems) {
        const orderedItem = order.items.find(
          (item) => item.productId === cartItem.productId,
        );
        if (!orderedItem) {
          continue;
        }
        await ctx.db.delete(cartItem._id);
      }
    }

    await ctx.db.patch(args.orderId, {
      orderStatus: "paid",
      paymentStatus: "paid",
      stripePaymentIntentId: paymentIntentId,
      paidAt: Date.now(),
      updatedAt: Date.now(),
    });

    return true;
  },
});
