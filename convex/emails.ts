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
          <td style="padding:14px;border-bottom:1px solid #f2d9e7;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td style="width:68px;vertical-align:middle;">
                  ${
                    item.imageUrl
                      ? `<img src="${htmlEscape(
                          item.imageUrl,
                        )}" alt="${htmlEscape(
                          item.name,
                        )}" width="56" height="56" style="display:block;width:56px;height:56px;object-fit:contain;border-radius:14px;background:#f7edf3;padding:6px;border:1px solid #f2d9e7;" />`
                      : `<div style="width:56px;height:56px;border-radius:14px;background:#f7edf3;border:1px solid #f2d9e7;"></div>`
                  }
                </td>
                <td style="vertical-align:middle;">
                  <div style="font-weight:800;color:#24111c;">${htmlEscape(
                    item.name,
                  )}</div>
                  <div style="font-size:13px;color:#7b6170;margin-top:3px;">${htmlEscape(
                    item.quantity,
                  )} x ${htmlEscape(formatCurrency(item.price))}</div>
                </td>
              </tr>
            </table>
          </td>
          <td style="padding:14px;border-bottom:1px solid #f2d9e7;text-align:left;font-weight:800;color:#24111c;white-space:nowrap;">${htmlEscape(
            formatCurrency(Number(item.price) * item.quantity),
          )}</td>
        </tr>`,
    )
    .join("");

  const receiptLink = receiptUrl
    ? `<p style="margin:26px 0 0;"><a href="${htmlEscape(
        receiptUrl,
      )}" style="display:inline-block;background:#f456a5;color:#24111c;text-decoration:none;font-weight:900;border-radius:16px;padding:13px 18px;">View receipt</a></p>`
    : "";

  return `
    <div style="margin:0;padding:0;background:#fbf7fa;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#fbf7fa;">
        <tr>
          <td style="padding:28px 14px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:720px;margin:0 auto;border-collapse:collapse;font-family:Arial,sans-serif;color:#24111c;">
              <tr>
                <td style="border-radius:28px 28px 0 0;background:#24111c;padding:34px 28px;color:#ffffff;background-image:radial-gradient(circle at top right, rgba(244,86,165,0.42), transparent 34%), radial-gradient(circle at bottom left, rgba(164,255,62,0.16), transparent 32%);">
                  <div style="display:inline-block;margin:0 0 18px;padding:7px 13px;border-radius:999px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.16);font-size:13px;font-weight:800;color:#f8d7e8;">Payment approved</div>
                  <h1 style="margin:0;font-size:34px;line-height:1.08;font-weight:900;">Thanks for buying from Razlo Store.</h1>
                  <p style="margin:14px 0 0;color:rgba(255,255,255,0.74);font-size:15px;line-height:1.7;">Your order is confirmed. Keep this email as your styled receipt.</p>
                </td>
              </tr>
              <tr>
                <td style="background:#ffffff;border:1px solid #f2d9e7;border-top:0;border-radius:0 0 28px 28px;padding:24px 28px 30px;box-shadow:0 18px 45px rgba(36,17,28,0.08);">
                  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:22px;">
                    <tr>
                      <td style="padding:0 0 14px;vertical-align:top;">
                        <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#f456a5;">Receipt</div>
                        <div style="margin-top:4px;font-size:22px;font-weight:900;color:#24111c;">${htmlEscape(
                          receiptNumber(String(order._id)),
                        )}</div>
                      </td>
                      <td style="padding:0 0 14px;text-align:right;vertical-align:top;">
                        <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#7b6170;">Total paid</div>
                        <div style="margin-top:4px;font-size:26px;font-weight:900;color:#24111c;">${htmlEscape(
                          formatCurrency(order.subtotal),
                        )}</div>
                      </td>
                    </tr>
                  </table>

                  <div style="padding:16px;border:1px solid #f2d9e7;border-radius:18px;background:#fbf7fa;margin-bottom:22px;">
                    <p style="margin:0;font-size:14px;color:#7b6170;"><strong style="color:#24111c;">Order:</strong> ${htmlEscape(
                      String(order._id),
                    )}</p>
                    <p style="margin:7px 0 0;font-size:14px;color:#7b6170;"><strong style="color:#24111c;">Paid:</strong> ${htmlEscape(
                      order.paidAt
                        ? new Date(order.paidAt).toLocaleString("he-IL")
                        : "-",
                    )}</p>
                    <p style="margin:7px 0 0;font-size:14px;color:#7b6170;"><strong style="color:#24111c;">Customer:</strong> ${htmlEscape(
                      order.customerName,
                    )}</p>
                  </div>

                  <table style="width:100%;border-collapse:separate;border-spacing:0;border:1px solid #f2d9e7;border-radius:18px;overflow:hidden;">
                    <thead>
                      <tr style="background:#f7edf3;">
                        <th style="padding:13px 14px;text-align:left;color:#24111c;font-size:13px;">Item</th>
                        <th style="padding:13px 14px;text-align:left;color:#24111c;font-size:13px;">Total</th>
                      </tr>
                    </thead>
                    <tbody>${itemRows}</tbody>
                  </table>

                  ${receiptLink}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>`;
}

const PURCHASE_NOTIFICATION_RECIPIENTS = [
  "xtremeytkids@gmail.com",
  "almondtor123@gmail.com",
];

function buildAdminPurchaseText(order: any, receiptUrl?: string) {
  const lines = [
    "New Razlo Store purchase",
    "",
    `Order: ${String(order._id)}`,
    `Paid: ${
      order.paidAt ? new Date(order.paidAt).toLocaleString("he-IL") : "-"
    }`,
    `Payment method: ${order.paymentMethod}`,
    `Payment status: ${order.paymentStatus}`,
    "",
    "Customer contact:",
    `Name: ${order.customerName}`,
    `Email: ${order.customerEmail}`,
    order.userId ? `User ID: ${String(order.userId)}` : "User ID: guest checkout",
    "",
    "Purchased items:",
    ...order.items.map(
      (item: any) =>
        `- ${item.name} x${item.quantity} @ ${formatCurrency(
          item.price,
        )} = ${formatCurrency(Number(item.price) * item.quantity)}`,
    ),
    "",
    `Total paid: ${formatCurrency(order.subtotal)}`,
  ];

  if (receiptUrl) {
    lines.push("", `Receipt: ${receiptUrl}`);
  }

  return lines.join("\n");
}

function buildAdminPurchaseHtml(order: any, receiptUrl?: string) {
  const itemRows = order.items
    .map(
      (item: any) => `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #e8e8e8;color:#1f2937;">${htmlEscape(
            item.name,
          )}</td>
          <td style="padding:12px;border-bottom:1px solid #e8e8e8;color:#1f2937;text-align:center;">${htmlEscape(
            item.quantity,
          )}</td>
          <td style="padding:12px;border-bottom:1px solid #e8e8e8;color:#1f2937;text-align:right;white-space:nowrap;">${htmlEscape(
            formatCurrency(item.price),
          )}</td>
          <td style="padding:12px;border-bottom:1px solid #e8e8e8;color:#111827;text-align:right;font-weight:700;white-space:nowrap;">${htmlEscape(
            formatCurrency(Number(item.price) * item.quantity),
          )}</td>
        </tr>`,
    )
    .join("");

  const receiptLink = receiptUrl
    ? `<p style="margin:18px 0 0;"><a href="${htmlEscape(
        receiptUrl,
      )}" style="color:#f456a5;font-weight:800;">Open receipt</a></p>`
    : "";

  return `
    <div style="margin:0;padding:24px;background:#f6f7f9;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <div style="padding:22px 24px;background:#111827;color:#ffffff;">
          <div style="font-size:13px;font-weight:800;color:#f9a8d4;text-transform:uppercase;letter-spacing:.06em;">New purchase</div>
          <h1 style="margin:8px 0 0;font-size:24px;line-height:1.25;">A customer bought from Razlo Store</h1>
        </div>
        <div style="padding:24px;">
          <h2 style="margin:0 0 10px;font-size:16px;">Customer contact</h2>
          <p style="margin:0 0 6px;"><strong>Name:</strong> ${htmlEscape(
            order.customerName,
          )}</p>
          <p style="margin:0 0 6px;"><strong>Email:</strong> <a href="mailto:${htmlEscape(
            order.customerEmail,
          )}" style="color:#f456a5;">${htmlEscape(order.customerEmail)}</a></p>
          <p style="margin:0 0 18px;"><strong>User ID:</strong> ${htmlEscape(
            order.userId ? String(order.userId) : "guest checkout",
          )}</p>

          <h2 style="margin:0 0 10px;font-size:16px;">Order</h2>
          <p style="margin:0 0 6px;"><strong>Order ID:</strong> ${htmlEscape(
            String(order._id),
          )}</p>
          <p style="margin:0 0 6px;"><strong>Paid:</strong> ${htmlEscape(
            order.paidAt ? new Date(order.paidAt).toLocaleString("he-IL") : "-",
          )}</p>
          <p style="margin:0 0 18px;"><strong>Total:</strong> ${htmlEscape(
            formatCurrency(order.subtotal),
          )}</p>

          <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="padding:12px;text-align:left;font-size:13px;color:#374151;">Item</th>
                <th style="padding:12px;text-align:center;font-size:13px;color:#374151;">Qty</th>
                <th style="padding:12px;text-align:right;font-size:13px;color:#374151;">Price</th>
                <th style="padding:12px;text-align:right;font-size:13px;color:#374151;">Line total</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
          ${receiptLink}
        </div>
      </div>
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

export const sendAdminPurchaseNotification = internalAction({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const claimed = await ctx.runMutation(
      internal.orders.claimOrderForAdminPurchaseEmail,
      { orderId: args.orderId },
    );
    if (!claimed) {
      return { status: "skipped" as const };
    }

    try {
      const order = await ctx.runQuery(internal.orders.orderForAdminPurchaseEmail, {
        orderId: args.orderId,
      });
      if (!order) {
        throw new Error("Paid order was not found");
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
        to: PURCHASE_NOTIFICATION_RECIPIENTS,
        replyTo: order.customerEmail,
        subject: `New Razlo Store purchase from ${order.customerName}`,
        text: buildAdminPurchaseText(order, receiptUrl),
        html: buildAdminPurchaseHtml(order, receiptUrl),
      });

      await ctx.runMutation(internal.orders.markAdminPurchaseEmailSent, {
        orderId: args.orderId,
      });

      return { status: "sent" as const };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Admin purchase notification email failed";
      await ctx.runMutation(internal.orders.markAdminPurchaseEmailFailed, {
        orderId: args.orderId,
        error: message,
      });
      throw error;
    }
  },
});
