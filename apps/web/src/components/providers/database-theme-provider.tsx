'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { browserLogger } from '@/lib/browser-logger';

type Theme = 'light' | 'dark' | 'system';

interface DatabaseThemeContextType {
  theme: Theme;
  databaseTheme: Theme;
  temporaryTheme: Theme | null;
  setTheme: (theme: Theme, persist?: boolean) => void;
  clearTemporaryTheme: () => void;
  isLoading: boolean;
}

const DatabaseThemeContext = createContext<DatabaseThemeContextType | undefined>(undefined);

interface DatabaseThemeProviderProps {
  children: ReactNode;
}

// Inner component that has access to next-themes
function ThemeController({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const status = 'unauthenticated';
  const { setTheme: setNextTheme } = useTheme();
  const [databaseTheme, setDatabaseTheme] = useState<Theme>('light');
  const [temporaryTheme, setTemporaryTheme] = useState<Theme | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const hasLoadedFromSession = useRef(false);

  // Handle mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load theme from session ONLY ONCE on initial load
  useEffect(() => {
    if (authLoading || hasLoadedFromSession.current) return;

    if (user) {
      // Get theme from user preferences
      const userTheme = user.themePreference || 'light';

      browserLogger.debug('Loading theme from user (initial load)', { 
        userTheme,
        hasTemporaryTheme: temporaryTheme !== null
      });

      setDatabaseTheme(userTheme);
      // Only set the next theme if there's no temporary override
      if (temporaryTheme === null) {
        setNextTheme(userTheme);
      }
    } else {
      // Not logged in, use light theme
      setDatabaseTheme('light');
      if (temporaryTheme === null) {
        setNextTheme('light');
      }
    }

    hasLoadedFromSession.current = true;
    setIsLoading(false);
  }, [user, authLoading, setNextTheme]); // Removed temporaryTheme from deps to prevent re-runs

  // Update next-themes when our theme changes (but only for user-initiated changes)
  const currentTheme = temporaryTheme || databaseTheme;

  const setTheme = async (newTheme: Theme, persist: boolean = false) => {
    browserLogger.debug('Setting theme', { newTheme, persist, current: currentTheme });

    if (persist) {
      // Persistent change - update database
      try {
        const response = await fetch('/api/admin/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ themePreference: newTheme }),
        });

        if (response.ok) {
          setDatabaseTheme(newTheme);
          setTemporaryTheme(null); // Clear temporary override
          setNextTheme(newTheme); // Update next-themes immediately
          browserLogger.debug('Theme saved to database', { newTheme });
        } else {
          browserLogger.error('Failed to save theme preference');
        }
      } catch (error) {
        browserLogger.error('Error saving theme preference', { error });
      }
    } else {
      // Temporary change - just update local state
      setTemporaryTheme(newTheme);
      setNextTheme(newTheme); // Update next-themes immediately
      browserLogger.debug('Set temporary theme', { newTheme });
    }
  };

  const clearTemporaryTheme = () => {
    setTemporaryTheme(null);
    setNextTheme(databaseTheme); // Revert to database theme
    browserLogger.debug('Cleared temporary theme, reverting to database theme', { databaseTheme });
  };

  const contextValue: DatabaseThemeContextType = {
    theme: currentTheme,
    databaseTheme,
    temporaryTheme,
    setTheme,
    clearTemporaryTheme,
    isLoading
  };

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <DatabaseThemeContext.Provider value={contextValue}>
      {children}
    </DatabaseThemeContext.Provider>
  );
}

export function DatabaseThemeProvider({ children }: DatabaseThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={true}
      storageKey="database-theme"
      disableTransitionOnChange={false}
    >
      <ThemeController>{children}</ThemeController>
    </NextThemesProvider>
  );
}

export function useDatabaseTheme() {
  const context = useContext(DatabaseThemeContext);
  if (context === undefined) {
    throw new Error('useDatabaseTheme must be used within a DatabaseThemeProvider');
  }
  return context;
} 