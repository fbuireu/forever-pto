import messages from '@i18n/messages/en.json';
import { routing } from '@infrastructure/i18n/routing';

declare namespace NodeJS {
  interface ProcessEnv {
    TURSO_AUTH_TOKEN: string;
    TURSO_DATABASE_URL: string;
    NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: string;
    NEXT_PUBLIC_EMAIL_SELF: string;
    NEXT_PUBLIC_SITE_URL: string;
  }
}

declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
    Formats: typeof getRequestConfig;
  }
}

declare global {
  interface Window {
    cookieStore: {
      get(name: string): Promise<{ name: string; value: string } | undefined>;
      set(options: { name: string; value: string; path?: string; maxAge: number }): Promise<void>;
    };
  }

  const cookieStore: Window['cookieStore'];
}

export {};
