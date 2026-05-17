"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { createElement, type ReactNode } from "react";

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return createElement(
    NextThemesProvider,
    {
      attribute: "class",
      defaultTheme: "system",
      enableSystem: true,
      disableTransitionOnChange: true,
    },
    children,
  );
}
