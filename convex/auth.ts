import { Email } from "@convex-dev/auth/providers/Email";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import {
  normalizeDisplayName,
  normalizeEmail,
  validatePasswordStrength,
} from "./security";

function verificationEmailHtml({ token, url }: { token: string; url: string }) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f8f5f8;font-family:Arial,Helvetica,sans-serif;color:#241922;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8f5f8;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #eadfea;border-radius:18px;overflow:hidden;box-shadow:0 18px 45px rgba(112,28,91,0.14);">
            <tr>
              <td style="background:linear-gradient(135deg,#7f255f,#ff4abd);padding:28px 30px;color:#ffffff;">
                <div style="font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;opacity:0.86;">Razlo Store</div>
                <h1 style="margin:10px 0 0;font-size:28px;line-height:1.15;font-weight:900;">Verify your email</h1>
                <p style="margin:10px 0 0;font-size:15px;line-height:1.6;opacity:0.9;">Use this code to finish creating your account.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:30px;">
                <div style="border:1px solid #eadfea;border-radius:14px;background:#fff8fd;padding:22px;text-align:center;">
                  <div style="font-size:13px;font-weight:700;color:#7b6375;margin-bottom:10px;">Verification code</div>
                  <div style="font-size:38px;line-height:1;font-weight:900;letter-spacing:0.22em;color:#241922;">${token}</div>
                </div>
                <p style="margin:22px 0 0;font-size:14px;line-height:1.7;color:#6d5f69;">This code expires soon. If you did not try to create an account, you can ignore this email.</p>
                <a href="${url}" style="display:inline-block;margin-top:24px;background:#241922;color:#ffffff;text-decoration:none;border-radius:10px;padding:13px 18px;font-size:14px;font-weight:800;">Open Razlo Store</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function sendVerificationEmail({
  identifier,
  token,
  url,
}: {
  identifier: string;
  token: string;
  url: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM ?? "Razlo Store <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn(`Email verification code for ${identifier}: ${token}`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: identifier,
      subject: "Verify your Razlo Store account",
      html: verificationEmailHtml({ token, url }),
      text: `Your Razlo Store verification code is ${token}`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send verification email: ${await response.text()}`);
  }
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  session: {
    totalDurationMs: 1000 * 60 * 60 * 24 * 14,
    inactiveDurationMs: 1000 * 60 * 60 * 24 * 3,
  },
  jwt: {
    durationMs: 1000 * 60 * 30,
  },
  signIn: {
    maxFailedAttempsPerHour: 5,
  },
  providers: [
    Password({
      profile(params: Record<string, unknown>) {
        const email = normalizeEmail(String(params.email ?? ""));
        const rawName = String(params.name ?? "").trim();
        const name = rawName
          ? normalizeDisplayName(rawName)
          : normalizeDisplayName(email.split("@")[0] ?? "User");

        return {
          email,
          name,
        };
      },
      validatePasswordRequirements(password: string) {
        validatePasswordStrength(password);
      },
      verify: Email({
        id: "verify-email",
        from: process.env.AUTH_EMAIL_FROM ?? "Razlo Store <onboarding@resend.dev>",
        maxAge: 10 * 60,
        async generateVerificationToken() {
          return String(Math.floor(100000 + Math.random() * 900000));
        },
        async sendVerificationRequest({ identifier, token, url }) {
          await sendVerificationEmail({ identifier, token, url });
        },
      }),
    }),
  ],
});
