'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

interface AuthenticatedThemeProviderProps {
  children: React.ReactNode
}

export function AuthenticatedThemeProvider({ 
  children
}: AuthenticatedThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
} 