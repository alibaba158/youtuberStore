"use node";

import nodemailer from "nodemailer";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

function getGmailUser() {
  return (
    process.env.GMAIL_USER?.trim() ||
    process.env.GMAIL_EMAIL?.trim() ||
    process.env.SMTP_USER?.trim()
  );
}

function getGmailPassword() {
  return (
    process.env.GMAIL_APP_PASSWORD?.trim() ||
    process.env.GMAIL_PASSWORD?.trim() ||
    process.env.SMTP_PASSWORD?.trim()
  );
}

function getAppUrl() {
  return (process.env.APP_URL || process.env.SITE_URL || "").replace(/\/$/, "");
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
  }).format(Number(value));
}

function receiptNumber(id: string) {
  return `RZ-${id.slice(-8).toUpperCase()}`;
}

function htmlEscape(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildReceiptText(order: any, receiptUrl?: string) {
  const lines = [
    "Razlo Store receipt",
    "",
    `Receipt: ${receiptNumber(String(order._id))}`,
    `Order: ${String(order._id)}`,
    `Paid: ${
      order.paidAt ? new Date(order.paidAt).toLocaleString("he-IL") : "-"
    }`,
    `Customer: ${order.customerName}`,
    `Email: ${order.customerEmail}`,
    "",
    "Items:",
    ...order.items.map(
      (item: any) =>
        `- ${item.name} x${item.quantity}: ${formatCurrency(
          Number(item.price) * item.quantity,
        )}`,
    ),
    "",
    `Total paid: ${formatCurrency(order.subtotal)}`,
  ];

  if (receiptUrl) {
    lines.push("", `View receipt: ${receiptUrl}`);
  }

  return lines.join("\n");
}

function buildReceiptHtml(order: any, receiptUrl?: string) {
  const itemRows = order.items
    .map(
      (item: any) => `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;">${htmlEscape(
            item.name,
          )}</td>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;">${htmlEscape(
            item.quantity,
          )}</td>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:left;">${htmlEscape(
            formatCurrency(Number(item.price) * item.quantity),
          )}</td>
        </tr>`,
    )
    .join("");

  const receiptLink = receiptUrl
    ? `<p style="margin:24px 0 0;"><a href="${htmlEscape(
        receiptUrl,
      )}" style="color:#2563eb;font-weight:700;">View receipt</a></p>`
    : "";

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;max-width:680px;margin:0 auto;padding:24px;">
      <p style="display:inline-block;margin:0 0 16px;padding:6px 12px;border-radius:999px;background:#dcfce7;color:#166534;font-weight:700;">Payment approved</p>
      <h1 style="margin:0 0 8px;font-size:28px;">Razlo Store receipt</h1>
      <p style="margin:0 0 24px;color:#6b7280;">Receipt ${htmlEscape(
        receiptNumber(String(order._id)),
      )}</p>

      <div style="padding:16px;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:20px;">
        <p style="margin:0;"><strong>Order:</strong> ${htmlEscape(
          String(order._id),
        )}</p>
        <p style="margin:6px 0 0;"><strong>Paid:</strong> ${htmlEscape(
          order.paidAt ? new Date(order.paidAt).toLocaleString("he-IL") : "-",
        )}</p>
        <p style="margin:6px 0 0;"><strong>Customer:</strong> ${htmlEscape(
          order.customerName,
        )}</p>
      </div>

      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:12px;text-align:left;">Item</th>
            <th style="padding:12px;text-align:center;">Qty</th>
            <th style="padding:12px;text-align:left;">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <p style="margin:24px 0 0;font-size:22px;font-weight:800;">Total paid: ${htmlEscape(
        formatCurrency(order.subtotal),
      )}</p>
      ${receiptLink}
    </div>`;
}

export const sendOrderReceipt = internalAction({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const claimed = await ctx.runMutation(
      internal.orders.claimOrderForReceiptEmail,
      { orderId: args.orderId },
    );
    if (!claimed) {
      return { status: "skipped" as const };
    }

    try {
      const order = await ctx.runQuery(internal.orders.orderForReceiptEmail, {
        orderId: args.orderId,
      });
      if (!order?.customerEmail) {
        throw new Error("Order does not have a customer email");
      }

      const user = getGmailUser();
      const pass = getGmailPassword();
      if (!user || !pass) {
        throw new Error(
          "Missing Gmail credentials. Set GMAIL_USER and GMAIL_APP_PASSWORD in Convex environment variables.",
        );
      }

      const receiptUrl = getAppUrl()
        ? `${getAppUrl()}/receipt/${String(order._id)}`
        : undefined;
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user,
          pass,
        },
      });

      await transporter.sendMail({
        from: process.env.GMAIL_FROM?.trim() || `Razlo Store <${user}>`,
        to: order.customerEmail,
        subject: `Your Razlo Store receipt ${receiptNumber(String(order._id))}`,
        text: buildReceiptText(order, receiptUrl),
        html: buildReceiptHtml(order, receiptUrl),
      });

      await ctx.runMutation(internal.orders.markReceiptEmailSent, {
        orderId: args.orderId,
      });

      return { status: "sent" as const };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Receipt email failed";
      await ctx.runMutation(internal.orders.markReceiptEmailFailed, {
        orderId: args.orderId,
        error: message,
      });
      throw error;
    }
  },
});
