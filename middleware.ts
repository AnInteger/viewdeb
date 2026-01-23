import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './src/i18n-config';

export default createMiddleware({
  // A list of all locales that are supported
  locales,
  
  // Used when no locale matches
  defaultLocale,
  
  // Remove the '/en' from the URL for default locale
  localePrefix: 'as-needed'
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(zh|en)/:path*']
};
