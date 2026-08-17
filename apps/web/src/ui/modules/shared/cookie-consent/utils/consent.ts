import * as CookieConsentLib from 'vanilla-cookieconsent';
import { COOKIE_SECTIONS } from '../config/config';

export const ANALYTICS_CATEGORY = 'analytics';
export const GOOGLE_ANALYTICS_SERVICE_ID = 'ga4';
export const BETTER_STACK_SERVICE_ID = 'betterStack';

export const ANALYTICS_SERVICE_IDS =
  COOKIE_SECTIONS.find((section) => section.id === ANALYTICS_CATEGORY)?.services?.map((service) => service.id) ?? [];

export const allAnalyticsServices = (granted: boolean): Record<string, boolean> =>
  Object.fromEntries(ANALYTICS_SERVICE_IDS.map((id) => [id, granted]));

export const isServiceConsented = (serviceId: string): boolean =>
  CookieConsentLib.acceptedService(serviceId, ANALYTICS_CATEGORY);

export const consentedAnalyticsServices = (): Record<string, boolean> =>
  Object.fromEntries(ANALYTICS_SERVICE_IDS.map((id) => [id, isServiceConsented(id)]));
