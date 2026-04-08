import { getLoginUrl } from "@/const";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { useEffect, useMemo } from "react";
import { api } from "../../../../convex/_generated/api";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const user = useQuery(api.store.currentUser);

  const state = useMemo(() => {
    localStorage.setItem("convex-user-info", JSON.stringify(user ?? null));
    return {
      user: user ?? null,
      loading: isLoading || (isAuthenticated && user === undefined),
      error: null,
      isAuthenticated,
    };
  }, [isAuthenticated, isLoading, user]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (state.loading) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    state.loading,
    state.user,
  ]);

  return {
    ...state,
    refresh: async () => undefined,
    logout: () => signOut(),
  };
}
