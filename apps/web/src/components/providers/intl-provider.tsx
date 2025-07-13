'use client';
import React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { ReactNode } from 'react';
import { DEFAULT_TIMEZONE } from '@/lib/i18n/config';
interface IntlProviderProps {
  children: ReactNode;
  locale: string;
  messages: any;
  timeZone?: string;
}
export const IntlProvider = function IntlProvider({ children, locale, messages, timeZone }: IntlProviderProps) {
  const effectiveTimeZone = timeZone || process.env.DEFAULT_TIMEZONE || DEFAULT_TIMEZONE;
  return (
    <NextIntlClientProvider 
      locale={locale} 
      messages={messages}
      timeZone={effectiveTimeZone}
    >
      {children}
    </NextIntlClientProvider>
  );
} 