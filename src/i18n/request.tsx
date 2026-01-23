import {getRequestConfig} from 'next-intl/server';

const locales = ['en', 'zh'] as const;
const defaultLocale = 'zh';

export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;

  if (!locale || !locales.includes(locale as any)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
