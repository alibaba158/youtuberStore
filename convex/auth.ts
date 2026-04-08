import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import {
  normalizeDisplayName,
  normalizeEmail,
  validatePasswordStrength,
} from "./security";

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
    }),
  ],
});
