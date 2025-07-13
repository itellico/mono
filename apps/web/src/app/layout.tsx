import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { JetBrains_Mono } from "next/font/google";
import { QueryProvider } from '@/components/providers/query-provider';
import { DatabaseThemeProvider } from '@/components/providers/database-theme-provider';
import { PermissionInspector } from '@/components/dev/PermissionInspector';
import { AuthMonitor } from '@/components/dev/AuthMonitor';
import { AuthProvider } from '@/contexts/auth-context';
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "itellico Mono",
  description: "Multi-tenant platform with authentication and role management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
        suppressHydrationWarning={true}
      >
        <QueryProvider>
          <AuthProvider>
            <DatabaseThemeProvider>
              {children}
              {/* <PermissionInspector /> */}
              {/* <AuthMonitor /> */}
            </DatabaseThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}