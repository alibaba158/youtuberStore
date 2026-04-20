"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import { normalizeRequiredText } from "./security";

function listMissingBitConfiguration() {
  const required = [
    "BIT_CLIENT_ID",
    "BIT_REDIRECT_URI",
    "BIT_RECEIVER_NAME",
    "BIT_RECEIVER_MSISDN",
    "BIT_TPP_SIGNATURE_CERT_BASE64",
    "BIT_TPP_PRIVATE_KEY_PEM",
  ] as const;

  return required.filter((name) => !process.env[name]);
}

function normalizePsuId(value: string, type: "ID" | "PASSPORT") {
  const normalized = normalizeRequiredText(value, "PSU ID", 32);
  if (type === "ID") {
    if (!/^\d+$/.test(normalized)) {
      throw new Error("Bit ID payments require digits only");
    }
    return normalized;
  }

  if (!/^[A-Z]{2}-[A-Za-z0-9]+$/.test(normalized)) {
    throw new Error(
      "Passport format must be COUNTRYCODE-passportNumber, for example IL-1234567",
    );
  }
  return normalized;
}

export const startBitPayment = action({
  args: {
    orderId: v.id("orders"),
    psuId: v.string(),
    psuIdType: v.union(v.literal("ID"), v.literal("PASSPORT")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

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

    const missing = listMissingBitConfiguration();
    const normalizedPsuId = normalizePsuId(args.psuId, args.psuIdType);

    await ctx.runMutation(internal.orders.saveBitPaymentStart, {
      orderId: args.orderId,
      psuId: normalizedPsuId,
      psuIdType: args.psuIdType,
      paymentStatus:
        missing.length > 0 ? "configuration_required" : "pending",
    });

    if (missing.length > 0) {
      return {
        status: "configuration_required" as const,
        missing,
        message:
          "Bit is not broken. This site is missing the Bit Open Banking server credentials and signing certificate needed to create real payments.",
      };
    }

    return {
      status: "not_ready" as const,
      message:
        "The checkout security is wired, but the live Bit request-signing and OAuth callback flow still needs to be completed with your registered Bit/Open Banking TPP credentials.",
    };
  },
});
