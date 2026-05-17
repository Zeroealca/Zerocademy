"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { logoutRequest } from "@/features/auth/api/auth.api";
import { useAuthStore } from "@/stores/use-auth-store";

export function useLogout() {
  const router = useRouter();
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        try {
          await logoutRequest(refreshToken);
        } catch {
          // Clear local session even if the API call fails
        }
      }
    },
    onSettled: () => {
      clearAuth();
      router.replace("/login");
    },
  });
}
