import type { NextRequest } from 'next/server';
import { DEFAULT_LOCALE, ALL_LOCALES } from '@/lib/i18n/config';

export function handleIntlRouting(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Check if pathname starts with a locale
  const pathnameHasLocale = ALL_LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    // Redirect to the same URL with the default locale prefix
    const newUrl = new URL(`/${DEFAULT_LOCALE}${pathname}`, request.url);
    newUrl.search = request.nextUrl.search;
    return newUrl;
  }

  return null;
}