import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { ThemeProvider } from '@/components/ThemeProvider';
import '../globals.css';

const locales = ['en', 'zh'] as const;

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'zh' }];
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Load messages directly based on locale param
  const messages = (await import(`../../i18n/messages/${locale}.json`)).default;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
