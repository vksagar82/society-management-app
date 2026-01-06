"use client";

import React, { useEffect } from "react";
import { ThemeProvider, useTheme } from "@/lib/theme/context";
import { AuthProvider } from "@/lib/auth/context";
import { NavBar } from "@/components/NavBar";
import { MainLayout } from "@/components/MainLayout";
import { Theme } from "@radix-ui/themes";

function ThemeAwareWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  useEffect(() => {
    document.body.className = `${theme} antialiased`;
  }, [theme]);

  return (
    <Theme
      appearance={theme}
      accentColor="cyan"
      grayColor="slate"
      radius="large"
      scaling="95%"
    >
      {children}
    </Theme>
  );
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ThemeAwareWrapper>
        <AuthProvider>
          <NavBar />
          <MainLayout>{children}</MainLayout>
        </AuthProvider>
      </ThemeAwareWrapper>
    </ThemeProvider>
  );
}
