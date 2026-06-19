"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

/**
 * Provider de thème scopé au panneau admin.
 * - `storageKey` dédiée : n'interfère pas avec un éventuel thème global.
 * - `attribute="class"` : next-themes pose `.dark` sur <html>. Les styles dark
 *   sont scopés sous `.admin-shell` (voir globals.css), donc les espaces
 *   candidat / employeur ne sont jamais affectés.
 */
export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="admin-theme"
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Activer le thème clair" : "Activer le thème sombre"}
      title={isDark ? "Thème clair" : "Thème sombre"}
      className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-jc-text-secondary hover:bg-jc-background hover:text-jc-text-primary transition-colors"
    >
      <Sun className="w-5 h-5 hidden dark:block" />
      <Moon className="w-5 h-5 block dark:hidden" />
    </button>
  );
}
