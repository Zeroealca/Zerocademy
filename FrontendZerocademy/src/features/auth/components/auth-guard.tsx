"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useAuthStore } from "@/stores/use-auth-store";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const { isLoading, isError } = useCurrentUser();

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hasHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (hasHydrated && isAuthenticated && isError) {
      useAuthStore.getState().clearAuth();
      router.replace("/login");
    }
  }, [hasHydrated, isAuthenticated, isError, router]);

  if (!hasHydrated || !isAuthenticated || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Cargando espacio de trabajo…</p>
      </div>
    );
  }

  return <>{children}</>;
}
