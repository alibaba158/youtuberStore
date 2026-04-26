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

function getFromEmail() {
  return (
    process.env.AUTH_EMAIL_FROM?.trim() ||
    process.env.GMAIL_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    undefined
  );
}

function getAdminRecipients() {
  const configured = process.env.ADMIN_EMAILS
    ?.split(",")
    .map(email => email.trim())
    .filter(Boolean);

  if (configured && configured.length > 0) {
    return configured;
  }

  return [
    "xtremeytkids@gmail.com",
    "almondtor123@gmail.com",
  ];
}

type EmailPayload = {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
};

async function sendViaBrevo(payload: EmailPayload) {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const from = getFromEmail();

  if (!apiKey || !from) {
    return false;
  }

  const fromMatch = from.match(/^(.*)<([^>]+)>$/);
  const sender = fromMatch
    ? {
        name: fromMatch[1].trim().replace(/^"|"$/g, ""),
        email: fromMatch[2].trim(),
      }
    : { email: from };

  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender,
      to: recipients.map(email => ({ email })),
      replyTo: payload.replyTo ? { email: payload.replyTo } : undefined,
      subject: payload.subject,
      htmlContent: payload.html,
      textContent: payload.text,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Brevo email request failed: ${response.status} ${message}`);
  }

  return true;
}

async function sendViaSmtp(payload: EmailPayload) {
  const user = getGmailUser();
  const pass = getGmailPassword();
  const from = getFromEmail() || (user ? `Razlo Store <${user}>` : undefined);

  if (!user || !pass || !from) {
    throw new Error(
      "Missing email configuration. Set BREVO_API_KEY and AUTH_EMAIL_FROM, or SMTP/Gmail credentials in Convex environment variables.",
    );
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim(),
    port: process.env.SMTP_PORT?.trim()
      ? Number(process.env.SMTP_PORT)
      : undefined,
    secure: process.env.SMTP_SECURE?.trim() === "true",
    service:
      !process.env.SMTP_HOST?.trim() && !process.env.SMTP_PORT?.trim()
        ? "gmail"
        : undefined,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to: payload.to,
    replyTo: payload.replyTo,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });
}

async function sendEmail(payload: EmailPayload) {
  try {
    await sendViaSmtp(payload);
    return;
  } catch (smtpError) {
    const hasBrevo = Boolean(process.env.BREVO_API_KEY?.trim());
    if (!hasBrevo) {
      throw smtpError;
    }
  }

  const sentWithBrevo = await sendViaBrevo(payload);
  if (sentWithBrevo) {
    return;
  }

  throw new Error("No email provider is configured");
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
    "Razlo Store - קבלה",
    "",
    `קבלה: ${receiptNumber(String(order._id))}`,
    `הזמנה: ${String(order._id)}`,
    `שולם בתאריך: ${
      order.paidAt ? new Date(order.paidAt).toLocaleString("he-IL") : "-"
    }`,
    `לקוח: ${order.customerName}`,
    `אימייל: ${order.customerEmail}`,
    "",
    "פריטים:",
    ...order.items.map(
      (item: any) =>
        `- ${item.name} x${item.quantity}: ${formatCurrency(
          Number(item.price) * item.quantity,
        )}`,
    ),
    "",
    `סה"כ שולם: ${formatCurrency(order.subtotal)}`,
  ];

  if (receiptUrl) {
    lines.push("", `צפה בקבלה: ${receiptUrl}`);
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
                <td style="vertical-align:middle;padding-right:12px;">
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
      )}" style="display:inline-block;background:#f456a5;color:#24111c;text-decoration:none;font-weight:900;border-radius:16px;padding:13px 18px;">צפה בקבלה</a></p>`
    : "";

  return `
    <div style="margin:0;padding:0;background:#fbf7fa;direction:rtl;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#fbf7fa;">
        <tr>
          <td style="padding:28px 14px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:720px;margin:0 auto;border-collapse:collapse;font-family:Arial,sans-serif;color:#24111c;text-align:right;">
              <tr>
                <td style="border-radius:28px 28px 0 0;background:#24111c;padding:34px 28px;color:#ffffff;background-image:radial-gradient(circle at top right, rgba(244,86,165,0.42), transparent 34%), radial-gradient(circle at bottom left, rgba(164,255,62,0.16), transparent 32%);">
                  <div style="display:inline-block;margin:0 0 18px;padding:7px 13px;border-radius:999px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.16);font-size:13px;font-weight:800;color:#f8d7e8;">התשלום אושר</div>
                  <h1 style="margin:0;font-size:34px;line-height:1.08;font-weight:900;">תודה שקנית בRazlo Store.</h1>
                  <p style="margin:14px 0 0;color:rgba(255,255,255,0.74);font-size:15px;line-height:1.7;">הזמנתך אושרה. שמור על אימייל זה כקבלה מעוצבת.</p>
                </td>
              </tr>
              <tr>
                <td style="background:#ffffff;border:1px solid #f2d9e7;border-top:0;border-radius:0 0 28px 28px;padding:24px 28px 30px;box-shadow:0 18px 45px rgba(36,17,28,0.08);">
                  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:22px;">
                    <tr>
                      <td style="padding:0 0 14px;vertical-align:top;text-align:right;">
                        <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#f456a5;">מספר קבלה</div>
                        <div style="margin-top:4px;font-size:22px;font-weight:900;color:#24111c;">${htmlEscape(
                          receiptNumber(String(order._id)),
                        )}</div>
                      </td>
                      <td style="padding:0 0 14px;text-align:left;vertical-align:top;">
                        <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#7b6170;">סה"כ שולם</div>
                        <div style="margin-top:4px;font-size:26px;font-weight:900;color:#24111c;">${htmlEscape(
                          formatCurrency(order.subtotal),
                        )}</div>
                      </td>
                    </tr>
                  </table>

                  <div style="padding:16px;border:1px solid #f2d9e7;border-radius:18px;background:#fbf7fa;margin-bottom:22px;">
                    <p style="margin:0;font-size:14px;color:#7b6170;"><strong style="color:#24111c;">הזמנה:</strong> ${htmlEscape(
                      String(order._id),
                    )}</p>
                    <p style="margin:7px 0 0;font-size:14px;color:#7b6170;"><strong style="color:#24111c;">תאריך:</strong> ${htmlEscape(
                      order.paidAt
                        ? new Date(order.paidAt).toLocaleString("he-IL")
                        : "-",
                    )}</p>
                    <p style="margin:7px 0 0;font-size:14px;color:#7b6170;"><strong style="color:#24111c;">לקוח:</strong> ${htmlEscape(
                      order.customerName,
                    )}</p>
                  </div>

                  <table style="width:100%;border-collapse:separate;border-spacing:0;border:1px solid #f2d9e7;border-radius:18px;overflow:hidden;direction:rtl;">
                    <thead>
                      <tr style="background:#f7edf3;">
                        <th style="padding:13px 14px;text-align:right;color:#24111c;font-size:13px;">פריט</th>
                        <th style="padding:13px 14px;text-align:left;color:#24111c;font-size:13px;">סה"כ</th>
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

function buildCustomerDeliveryText(order: any, receiptUrl?: string) {
  const lines = [
    "Razlo Store - פרטי מוצר",
    "",
    `הזמנה: ${String(order._id)}`,
    `לקוח: ${order.customerName}`,
    `אימייל: ${order.customerEmail}`,
    "",
    "פרטי המוצר:",
  ];

  for (const item of order.items) {
    lines.push(
      "",
      `${item.name} x${item.quantity}`,
      item.deliveryContent || "לא נוספו פרטי מוצר עדיין.",
    );
  }

  if (receiptUrl) {
    lines.push("", `קבלה: ${receiptUrl}`);
  }

  return lines.join("\n");
}

function buildCustomerDeliveryHtml(order: any, receiptUrl?: string) {
  const itemCards = order.items
    .map(
      (item: any) => `
        <div style="margin:0 0 16px;padding:16px;border:1px solid #f2d9e7;border-radius:18px;background:#ffffff;text-align:right;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;direction:rtl;">
            <tr>
              <td style="width:72px;vertical-align:top;">
                ${
                  item.imageUrl
                    ? `<img src="${htmlEscape(
                        item.imageUrl,
                      )}" alt="${htmlEscape(
                        item.name,
                      )}" width="58" height="58" style="display:block;width:58px;height:58px;object-fit:contain;border-radius:14px;background:#f7edf3;padding:6px;border:1px solid #f2d9e7;" />`
                    : `<div style="width:58px;height:58px;border-radius:14px;background:#f7edf3;border:1px solid #f2d9e7;"></div>`
                }
              </td>
              <td style="vertical-align:top;padding-right:12px;">
                <div style="font-size:17px;font-weight:900;color:#24111c;">${htmlEscape(
                  item.name,
                )}</div>
                <div style="margin-top:4px;font-size:13px;color:#7b6170;">כמות: ${htmlEscape(
                  item.quantity,
                )}</div>
              </td>
            </tr>
          </table>
          <div style="margin-top:14px;padding:14px;border-radius:14px;background:#fbf7fa;border:1px dashed #f2b6d7;color:#24111c;font-size:14px;line-height:1.7;white-space:pre-wrap;">${htmlEscape(
            item.deliveryContent || "לא נוספו פרטי מוצר עדיין.",
          )}</div>
        </div>`,
    )
    .join("");

  const receiptLink = receiptUrl
    ? `<p style="margin:22px 0 0;"><a href="${htmlEscape(
        receiptUrl,
      )}" style="display:inline-block;background:#f456a5;color:#24111c;text-decoration:none;font-weight:900;border-radius:16px;padding:13px 18px;">פתח קבלה</a></p>`
    : "";

  return `
    <div style="margin:0;padding:0;background:#fbf7fa;direction:rtl;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#fbf7fa;">
        <tr>
          <td style="padding:28px 14px;">
            <div style="width:100%;max-width:720px;margin:0 auto;font-family:Arial,sans-serif;color:#24111c;">
              <div style="border-radius:28px 28px 0 0;background:#24111c;padding:32px 28px;color:#ffffff;background-image:radial-gradient(circle at top right, rgba(244,86,165,0.42), transparent 34%), radial-gradient(circle at bottom left, rgba(164,255,62,0.16), transparent 32%);text-align:right;">
                <div style="display:inline-block;margin:0 0 18px;padding:7px 13px;border-radius:999px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.16);font-size:13px;font-weight:800;color:#f8d7e8;">פרטי מוצר</div>
                <h1 style="margin:0;font-size:32px;line-height:1.12;font-weight:900;">פרטי ההזמנה שלך ב-Razlo Store</h1>
                <p style="margin:14px 0 0;color:rgba(255,255,255,0.74);font-size:15px;line-height:1.7;">צוות האדמין שלח את פרטי המוצר עבור הזמנתך ששולמה.</p>
              </div>
              <div style="background:#fbf7fa;border:1px solid #f2d9e7;border-top:0;border-radius:0 0 28px 28px;padding:24px 28px 30px;box-shadow:0 18px 45px rgba(36,17,28,0.08);text-align:right;">
                <div style="padding:16px;border:1px solid #f2d9e7;border-radius:18px;background:#ffffff;margin-bottom:20px;">
                  <p style="margin:0;font-size:14px;color:#7b6170;"><strong style="color:#24111c;">הזמנה:</strong> ${htmlEscape(
                    String(order._id),
                  )}</p>
                  <p style="margin:7px 0 0;font-size:14px;color:#7b6170;"><strong style="color:#24111c;">לקוח:</strong> ${htmlEscape(
                    order.customerName,
                  )}</p>
                </div>
                ${itemCards}
                ${receiptLink}
              </div>
            </div>
          </td>
        </tr>
      </table>
    </div>`;
}

function buildAdminPurchaseText(order: any, receiptUrl?: string) {
  const lines = [
    "רכישה חדשה בRazlo Store",
    "",
    `הזמנה: ${String(order._id)}`,
    `שולמה בתאריך: ${
      order.paidAt ? new Date(order.paidAt).toLocaleString("he-IL") : "-"
    }`,
    `אמצעי תשלום: ${order.paymentMethod}`,
    `סטטוס תשלום: ${order.paymentStatus}`,
    "",
    "פרטי לקוח:",
    `שם: ${order.customerName}`,
    `אימייל: ${order.customerEmail}`,
    order.userId ? `מזהה משתמש: ${String(order.userId)}` : "מזהה משתמש: אורח",
    "",
    "פריטים שנרכשו:",
    ...order.items.map(
      (item: any) =>
        `- ${item.name} x${item.quantity} @ ${formatCurrency(
          item.price,
        )} = ${formatCurrency(Number(item.price) * item.quantity)}`,
    ),
    "",
    `סה"כ שולם: ${formatCurrency(order.subtotal)}`,
  ];

  if (receiptUrl) {
    lines.push("", `קבלה: ${receiptUrl}`);
  }

  return lines.join("\n");
}

function buildAdminPurchaseHtml(order: any, receiptUrl?: string) {
  const itemRows = order.items
    .map(
      (item: any) => `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #e8e8e8;color:#1f2937;text-align:right;">${htmlEscape(
            item.name,
          )}</td>
          <td style="padding:12px;border-bottom:1px solid #e8e8e8;color:#1f2937;text-align:center;">${htmlEscape(
            item.quantity,
          )}</td>
          <td style="padding:12px;border-bottom:1px solid #e8e8e8;color:#1f2937;text-align:left;white-space:nowrap;">${htmlEscape(
            formatCurrency(item.price),
          )}</td>
          <td style="padding:12px;border-bottom:1px solid #e8e8e8;color:#111827;text-align:left;font-weight:700;white-space:nowrap;">${htmlEscape(
            formatCurrency(Number(item.price) * item.quantity),
          )}</td>
        </tr>`,
    )
    .join("");

  const receiptLink = receiptUrl
    ? `<p style="margin:18px 0 0;"><a href="${htmlEscape(
        receiptUrl,
      )}" style="color:#f456a5;font-weight:800;">פתח קבלה</a></p>`
    : "";

  return `
    <div style="margin:0;padding:24px;background:#f6f7f9;font-family:Arial,sans-serif;color:#111827;direction:rtl;">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <div style="padding:22px 24px;background:#111827;color:#ffffff;text-align:right;">
          <div style="font-size:13px;font-weight:800;color:#f9a8d4;text-transform:uppercase;letter-spacing:.06em;">רכישה חדשה</div>
          <h1 style="margin:8px 0 0;font-size:24px;line-height:1.25;">לקוח קנה בRazlo Store</h1>
        </div>
        <div style="padding:24px;text-align:right;">
          <h2 style="margin:0 0 10px;font-size:16px;">פרטי לקוח</h2>
          <p style="margin:0 0 6px;"><strong>שם:</strong> ${htmlEscape(
            order.customerName,
          )}</p>
          <p style="margin:0 0 6px;"><strong>אימייל:</strong> <a href="mailto:${htmlEscape(
            order.customerEmail,
          )}" style="color:#f456a5;">${htmlEscape(order.customerEmail)}</a></p>
          <p style="margin:0 0 18px;"><strong>מזהה משתמש:</strong> ${htmlEscape(
            order.userId ? String(order.userId) : "אורח",
          )}</p>

          <h2 style="margin:0 0 10px;font-size:16px;">הזמנה</h2>
          <p style="margin:0 0 6px;"><strong>מזהה הזמנה:</strong> ${htmlEscape(
            String(order._id),
          )}</p>
          <p style="margin:0 0 6px;"><strong>תאריך:</strong> ${htmlEscape(
            order.paidAt ? new Date(order.paidAt).toLocaleString("he-IL") : "-",
          )}</p>
          <p style="margin:0 0 18px;"><strong>סה"כ:</strong> ${htmlEscape(
            formatCurrency(order.subtotal),
          )}</p>

          <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="padding:12px;text-align:right;font-size:13px;color:#374151;">פריט</th>
                <th style="padding:12px;text-align:center;font-size:13px;color:#374151;">כמות</th>
                <th style="padding:12px;text-align:left;font-size:13px;color:#374151;">מחיר</th>
                <th style="padding:12px;text-align:left;font-size:13px;color:#374151;">סה"כ שורה</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
          ${receiptLink}
        </div>
      </div>
    </div>`;
}

function buildMysteryBoxReceiptHtml(order: any, receiptUrl?: string) {
  const itemRows = order.items
    .map(
      (item: any) => `
        <tr>
          <td style="padding:14px 16px;border-bottom:1px solid #2a1a3e;">
            <div style="font-weight:800;color:#f0e6ff;font-size:15px;">🎁 ${htmlEscape(item.name)}</div>
            <div style="font-size:13px;color:#9b7fc7;margin-top:3px;">${htmlEscape(item.quantity)} x ${htmlEscape(formatCurrency(item.price))}</div>
          </td>
          <td style="padding:14px 16px;border-bottom:1px solid #2a1a3e;text-align:left;font-weight:900;color:#e8c8ff;white-space:nowrap;font-size:16px;">${htmlEscape(formatCurrency(Number(item.price) * item.quantity))}</td>
        </tr>`,
    )
    .join("");

  const receiptLink = receiptUrl
    ? `<p style="margin:28px 0 0;text-align:center;"><a href="${htmlEscape(receiptUrl)}" style="display:inline-block;background:linear-gradient(135deg,#c026d3,#7c3aed);color:#ffffff;text-decoration:none;font-weight:900;border-radius:999px;padding:14px 32px;font-size:15px;letter-spacing:0.04em;">צפה בקבלה שלך</a></p>`
    : "";

  return `
    <div style="margin:0;padding:0;background:#0d0618;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#0d0618;">
        <tr>
          <td style="padding:32px 14px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:680px;margin:0 auto;border-collapse:collapse;font-family:Arial,sans-serif;direction:rtl;">

              <!-- Header -->
              <tr>
                <td style="border-radius:24px 24px 0 0;background:linear-gradient(160deg,#1a0533 0%,#0d0618 60%);padding:40px 32px 36px;text-align:center;border:1px solid #3b1f5e;border-bottom:0;position:relative;">
                  <div style="font-size:52px;margin-bottom:12px;">🎁</div>
                  <div style="display:inline-block;margin:0 0 16px;padding:6px 16px;border-radius:999px;background:rgba(192,38,211,0.18);border:1px solid rgba(192,38,211,0.4);font-size:12px;font-weight:800;color:#e879f9;letter-spacing:0.1em;text-transform:uppercase;">תשלום אושר</div>
                  <h1 style="margin:0;font-size:30px;line-height:1.15;font-weight:900;color:#f0e6ff;">תיבת המסתורין שלך בדרך...</h1>
                  <p style="margin:14px 0 0;color:#9b7fc7;font-size:15px;line-height:1.8;">תודה על הרכישה מ-Razlo Store.<br/>בקרוב מאוד תקבל את חשבון המסתורין שלך.</p>
                  <!-- Stars decoration -->
                  <div style="margin-top:20px;font-size:18px;letter-spacing:8px;color:#7c3aed;">✦ ✦ ✦</div>
                </td>
              </tr>

              <!-- Mystery message -->
              <tr>
                <td style="background:linear-gradient(180deg,#130824 0%,#0f0520 100%);padding:28px 32px;border-left:1px solid #3b1f5e;border-right:1px solid #3b1f5e;text-align:center;">
                  <div style="border:1px dashed #5b21b6;border-radius:18px;padding:22px 24px;background:rgba(124,58,237,0.08);">
                    <p style="margin:0;font-size:17px;font-weight:900;color:#e8c8ff;line-height:1.8;">
                      🌙 בקרוב מאוד נשלח אליך את חשבון המסתורין שלך
                    </p>
                    <p style="margin:12px 0 0;font-size:14px;color:#9b7fc7;line-height:1.9;">
                      הצוות שלנו מכין את החשבון עבורך.<br/>
                      תקבל אותו בהקדם האפשרי — שמור על הסבלנות, שווה את זה! ✨
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Order details -->
              <tr>
                <td style="background:#0f0520;padding:0 32px 24px;border-left:1px solid #3b1f5e;border-right:1px solid #3b1f5e;">
                  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:18px;">
                    <tr>
                      <td style="padding:0 0 12px;vertical-align:top;">
                        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#7c3aed;">קבלה</div>
                        <div style="margin-top:4px;font-size:20px;font-weight:900;color:#e8c8ff;">${htmlEscape(receiptNumber(String(order._id)))}</div>
                      </td>
                      <td style="padding:0 0 12px;text-align:left;vertical-align:top;">
                        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#7c3aed;">סה"כ שולם</div>
                        <div style="margin-top:4px;font-size:22px;font-weight:900;color:#e8c8ff;">${htmlEscape(formatCurrency(order.subtotal))}</div>
                      </td>
                    </tr>
                  </table>

                  <div style="padding:14px 16px;border:1px solid #2a1a3e;border-radius:14px;background:#1a0533;margin-bottom:18px;">
                    <p style="margin:0;font-size:13px;color:#9b7fc7;"><strong style="color:#c4b5fd;">הזמנה:</strong> ${htmlEscape(String(order._id))}</p>
                    <p style="margin:7px 0 0;font-size:13px;color:#9b7fc7;"><strong style="color:#c4b5fd;">תאריך:</strong> ${htmlEscape(order.paidAt ? new Date(order.paidAt).toLocaleString("he-IL") : "-")}</p>
                    <p style="margin:7px 0 0;font-size:13px;color:#9b7fc7;"><strong style="color:#c4b5fd;">לקוח:</strong> ${htmlEscape(order.customerName)}</p>
                  </div>

                  <table style="width:100%;border-collapse:collapse;border:1px solid #2a1a3e;border-radius:14px;overflow:hidden;">
                    <thead>
                      <tr style="background:#1a0533;">
                        <th style="padding:12px 16px;text-align:right;color:#9b7fc7;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">פריט</th>
                        <th style="padding:12px 16px;text-align:left;color:#9b7fc7;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">סכום</th>
                      </tr>
                    </thead>
                    <tbody>${itemRows}</tbody>
                  </table>

                  ${receiptLink}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="border-radius:0 0 24px 24px;background:#0a0414;padding:22px 32px;text-align:center;border:1px solid #3b1f5e;border-top:1px solid #2a1a3e;">
                  <div style="font-size:20px;margin-bottom:8px;">✦ Razlo Store ✦</div>
                  <p style="margin:0;font-size:12px;color:#5b21b6;">המסתורין ממתין לך...</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </div>`;
}

function buildMysteryBoxReceiptText(order: any, receiptUrl?: string) {
  const lines = [
    "🎁 תיבת המסתורין שלך בדרך — Razlo Store",
    "",
    `קבלה: ${receiptNumber(String(order._id))}`,
    `הזמנה: ${String(order._id)}`,
    `תאריך: ${order.paidAt ? new Date(order.paidAt).toLocaleString("he-IL") : "-"}`,
    `לקוח: ${order.customerName}`,
    "",
    "בקרוב מאוד נשלח אליך את חשבון המסתורין שלך.",
    "הצוות שלנו מכין את החשבון עבורך — שמור על הסבלנות, שווה את זה!",
    "",
    `סה"כ שולם: ${formatCurrency(order.subtotal)}`,
  ];
  if (receiptUrl) lines.push("", `קבלה: ${receiptUrl}`);
  return lines.join("\n");
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

      const receiptUrl = getAppUrl()
        ? `${getAppUrl()}/receipt/${String(order._id)}`
        : undefined;

      const isMysteryBoxOrder = order.items.some((item: any) => item.isMysteryBox);

      await sendEmail({
        to: order.customerEmail,
        subject: isMysteryBoxOrder
          ? `🎁 תיבת המסתורין שלך בדרך — Razlo Store`
          : `הקבלה שלך מ-Razlo Store ${receiptNumber(String(order._id))}`,
        text: isMysteryBoxOrder
          ? buildMysteryBoxReceiptText(order, receiptUrl)
          : buildReceiptText(order, receiptUrl),
        html: isMysteryBoxOrder
          ? buildMysteryBoxReceiptHtml(order, receiptUrl)
          : buildReceiptHtml(order, receiptUrl),
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

      const receiptUrl = getAppUrl()
        ? `${getAppUrl()}/receipt/${String(order._id)}`
        : undefined;

      await sendEmail({
        to: getAdminRecipients(),
        replyTo: order.customerEmail,
        subject: `רכישה חדשה בRazlo Store מאת ${order.customerName}`,
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

export const sendCustomerDeliveryEmail = internalAction({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const claimed = await ctx.runMutation(
      internal.orders.claimOrderForCustomerDeliveryEmail,
      { orderId: args.orderId },
    );
    if (!claimed) {
      return { status: "skipped" as const };
    }

    try {
      const order = await ctx.runQuery(
        internal.orders.orderForCustomerDeliveryEmail,
        {
          orderId: args.orderId,
        },
      );
      if (!order?.customerEmail) {
        throw new Error("Order does not have a customer email");
      }

      const receiptUrl = getAppUrl()
        ? `${getAppUrl()}/receipt/${String(order._id)}`
        : undefined;

      await sendEmail({
        to: order.customerEmail,
        subject: `פרטי המוצר שלך בRazlo Store ${receiptNumber(String(order._id))}`,
        text: buildCustomerDeliveryText(order, receiptUrl),
        html: buildCustomerDeliveryHtml(order, receiptUrl),
      });

      await ctx.runMutation(internal.orders.markCustomerDeliveryEmailSent, {
        orderId: args.orderId,
      });

      return { status: "sent" as const };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Customer delivery email failed";
      await ctx.runMutation(internal.orders.markCustomerDeliveryEmailFailed, {
        orderId: args.orderId,
        error: message,
      });
      throw error;
    }
  },
});
