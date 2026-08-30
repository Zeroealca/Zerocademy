"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { createQueryClient } from "@/lib/query-client";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { useAuthStore } from "@/stores/use-auth-store";

interface AppProvidersProps {
  children: ReactNode;
}

function AuthStoreHydration() {
  useEffect(() => {
    const finish = () => {
      useAuthStore.getState().setHasHydrated(true);
    };

    if (useAuthStore.persist.hasHydrated()) {
      finish();
      return;
    }

    return useAuthStore.persist.onFinishHydration(finish);
  }, []);

  return null;
}

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthStoreHydration />
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
