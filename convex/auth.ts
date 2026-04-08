import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params: Record<string, unknown>) {
        const email = String(params.email ?? "").trim().toLowerCase();
        const name = String(params.name ?? "").trim();

        if (!email) {
          throw new Error("Email is required");
        }

        return {
          email,
          name: name || email.split("@")[0],
        };
      },
    }),
  ],
});
