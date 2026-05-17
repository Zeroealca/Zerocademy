"use client";

import { useMutation } from "@tanstack/react-query";
import { loginRequest } from "@/features/auth/api/auth.api";
import type { LoginInput } from "@/features/auth/schemas/login.schema";
import { useAuthStore } from "@/stores/use-auth-store";

export function useLogin() {
  const setTokens = useAuthStore((state) => state.setTokens);

  return useMutation({
    mutationFn: (input: LoginInput) => loginRequest(input),
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken, data.user);
    },
  });
}
