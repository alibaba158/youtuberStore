"use node";

import Stripe from "stripe";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";

const STRIPE_API_VERSION = "2026-03-25.dahlia";

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  return new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
  });
}

function getAppUrl() {
  const appUrl = process.env.APP_URL;
  if (!appUrl) {
    throw new Error("Missing APP_URL");
  }
  return appUrl.replace(/\/$/, "");
}

function getStripeWebhookSecret() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET");
  }
  return webhookSecret;
}

function listMissingStripeConfiguration() {
  const required = [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "APP_URL",
  ] as const;

  return required.filter((name) => !process.env[name]);
}

function listMissingStripeConfirmationConfiguration() {
  const required = ["STRIPE_SECRET_KEY"] as const;
  return required.filter((name) => !process.env[name]);
}

export const startCheckout = action({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const order = await ctx.runQuery(api.orders.orderById, {
      id: args.orderId,
    });
    if (!order) {
      throw new Error("Order not found");
    }
    if (order.orderStatus === "paid") {
      return {
        status: "already_paid" as const,
      };
    }
    if (order.orderStatus === "canceled") {
      throw new Error("This order was canceled");
    }

    const missing = listMissingStripeConfiguration();
    if (missing.length > 0) {
      return {
        status: "configuration_required" as const,
        missing,
        message:
          "Stripe is not fully configured yet. Add STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET and APP_URL on the server before enabling checkout.",
      };
    }

    const stripe = getStripe();
    const appUrl = getAppUrl();

    await ctx.runMutation(internal.orders.validateOrderCanStartStripeCheckout, {
      orderId: args.orderId,
    });

    await ctx.runMutation(internal.orders.reserveStockForStripeCheckout, {
      orderId: args.orderId,
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${appUrl}/checkout/${args.orderId}?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/${args.orderId}?status=cancelled`,
      customer_email: order.customerEmail || undefined,
      payment_intent_data: order.customerEmail
        ? {
            receipt_email: order.customerEmail,
          }
        : undefined,
      client_reference_id: String(args.orderId),
      metadata: {
        orderId: String(args.orderId),
      },
      line_items: order.items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "ils",
          unit_amount: Math.round(Number(item.price) * 100),
          product_data: {
            name: item.name,
          },
        },
      })),
    });

    await ctx.runMutation(internal.orders.saveStripeCheckoutSession, {
      orderId: args.orderId,
      checkoutSessionId: session.id,
      paymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : undefined,
      paymentStatus: "redirect_required",
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL");
    }

    return {
      status: "redirect_required" as const,
      url: session.url,
    };
  },
});

export const confirmCheckoutSession = action({
  args: {
    orderId: v.id("orders"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const missing = listMissingStripeConfirmationConfiguration();
    if (missing.length > 0) {
      return {
        status: "configuration_required" as const,
        missing,
      };
    }

    const sessionId = args.sessionId.trim();
    if (!sessionId) {
      throw new Error("Missing Stripe session ID");
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.metadata?.orderId !== String(args.orderId)) {
      throw new Error("Stripe session metadata does not match this order");
    }

    if (session.payment_status !== "paid") {
      return {
        status: "awaiting_payment" as const,
        paymentStatus: session.payment_status,
      };
    }

    await ctx.runMutation(internal.orders.markOrderPaidFromStripe, {
      orderId: args.orderId,
      checkoutSessionId: session.id,
      paymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : undefined,
      amountTotal: session.amount_total ?? 0,
      currency: session.currency ?? "",
      paymentStatus: session.payment_status,
    });

    return {
      status: "paid" as const,
    };
  },
});
