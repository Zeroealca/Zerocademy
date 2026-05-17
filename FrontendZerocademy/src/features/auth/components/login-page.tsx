"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LoginForm } from "@/features/auth/components/login-form";
import { useAuthStore } from "@/stores/use-auth-store";

export function LoginPage() {
  const router = useRouter();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [hasHydrated, isAuthenticated, router]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-end px-6 py-4">
        <ThemeToggle />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-16">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Zerocademy
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Academic Management
          </h1>
        </div>
        <LoginForm onSuccess={() => router.replace("/dashboard")} />
      </main>
    </div>
  );
}
