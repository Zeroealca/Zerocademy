"use client";

import { useQuery } from "@tanstack/react-query";
import { authKeys } from "@/features/auth/api/auth.keys";
import { getCurrentUser } from "@/features/auth/api/auth.api";
import { useAuthStore } from "@/stores/use-auth-store";

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  return useQuery({
    queryKey: authKeys.me(),
    queryFn: getCurrentUser,
    enabled: hasHydrated && isAuthenticated,
    staleTime: 5 * 60_000,
  });
}
