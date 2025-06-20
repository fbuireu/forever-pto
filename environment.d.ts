import messages from '@i18n/messages/en.json';
import { routing } from '@infrastructure/i18n/routing/routing';

declare namespace NodeJS {
	interface ProcessEnv {
		NEXT_PUBLIC_KOFI_USERNAME: string;
		TURSO_AUTH_TOKEN: string;
		TURSO_DATABASE_URL: string;
		KOFI_WIDGET_SRC: string;
	}
}

declare module "next-intl" {
	interface AppConfig {
		Locale: (typeof routing.locales)[number];
		Messages: typeof messages;
		Formats: typeof getRequestConfig;
	}
}
