import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "REPRESENTATIVE";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setTokens: (
    accessToken: string,
    refreshToken: string,
    user: AuthUser,
  ) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setTokens: (accessToken, refreshToken, user) =>
        set({
          accessToken,
          refreshToken,
          user,
          // Login can finish before persist rehydration; never soft-lock AuthGuard.
          hasHydrated: true,
        }),
      clearAuth: () =>
        set({ accessToken: null, refreshToken: null, user: null }),
      isAuthenticated: () =>
        Boolean(get().accessToken && get().refreshToken && get().user),
    }),
    {
      name: "zerocademy-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state, error) => {
        // Always mark hydrated — even when rehydration fails — or AuthGuard
        // stays on "Cargando espacio de trabajo…" forever.
        if (state) {
          state.setHasHydrated(true);
        } else {
          useAuthStore.setState({ hasHydrated: true });
        }
        if (error) {
          console.error("Auth store rehydration failed", error);
        }
      },
    },
  ),
);
