import Stripe from "stripe";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

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

function getStripeWebhookSecret() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET");
  }
  return webhookSecret;
}

export const webhook = httpAction(async (ctx, request) => {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const payload = await request.text();
    event = await getStripe().webhooks.constructEventAsync(
      payload,
      signature,
      getStripeWebhookSecret(),
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Invalid Stripe webhook",
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status !== "paid") {
          break;
        }

        const orderId = session.metadata?.orderId;
        if (!orderId) {
          throw new Error("Stripe session missing orderId metadata");
        }

        await ctx.runMutation(internal.orders.markOrderPaidFromStripe, {
          orderId: orderId as Id<"orders">,
          checkoutSessionId: session.id,
          paymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : undefined,
          amountTotal: session.amount_total ?? 0,
          currency: session.currency ?? "",
          paymentStatus: session.payment_status,
        });
        try {
          await ctx.runAction(internal.emails.sendOrderReceipt, {
            orderId: orderId as Id<"orders">,
          });
        } catch (error) {
          console.error("Receipt email failed", error);
        }
        try {
          await ctx.runAction(internal.emails.sendAdminPurchaseNotification, {
            orderId: orderId as Id<"orders">,
          });
        } catch (error) {
          console.error("Admin purchase notification email failed", error);
        }
        break;
      }
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        if (orderId) {
          await ctx.runMutation(internal.orders.markOrderPaymentFailed, {
            orderId: orderId as Id<"orders">,
            paymentStatus: "failed",
            transactionStatus: session.payment_status ?? undefined,
          });
        }
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        if (orderId) {
          await ctx.runMutation(internal.orders.markOrderPaymentFailed, {
            orderId: orderId as Id<"orders">,
            paymentStatus: "expired",
          });
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Webhook handling failed",
      { status: 400 },
    );
  }

  return new Response("ok", { status: 200 });
});
