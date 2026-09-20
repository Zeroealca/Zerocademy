import { apiClient } from "@/lib/api-client";
import type { AuthUser } from "@/stores/use-auth-store";

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export function loginRequest(payload: LoginPayload): Promise<AuthTokensResponse> {
  console.log("loginRequest payload:", payload);
  return apiClient<AuthTokensResponse>("/v1/auth/login", {
    method: "POST",
    body: payload,
    skipAuth: true,
  });
}

export function logoutRequest(refreshToken: string): Promise<{ success: true }> {
  return apiClient<{ success: true }>("/v1/auth/logout", {
    method: "POST",
    body: { refreshToken },
  });
}

export function getCurrentUser(): Promise<AuthUser> {
  return apiClient<AuthUser>("/v1/auth/me");
}
