import type messages from '@i18n/messages/en.json';

type CookiesKey = keyof (typeof messages)['cookies'];

export interface CookieEntry {
  name: string;
  expiryKey: CookiesKey;
  expiryParams?: Record<string, number>;
  descriptionKey: CookiesKey;
  provider: string;
  learnMoreUrl?: string;
}

export interface CookieSection {
  id: 'necessary' | 'analytics';
  cookies: CookieEntry[];
}

export const COOKIE_SECTIONS: CookieSection[] = [
  {
    id: 'necessary',
    cookies: [
      {
        name: 'user-country',
        expiryKey: 'week',
        descriptionKey: 'userCountryDesc',
        provider: 'Forever PTO',
      },
      {
        name: 'cc_cookie',
        expiryKey: 'months',
        expiryParams: { count: 6 },
        descriptionKey: 'ccCookieDesc',
        provider: 'Forever PTO',
      },
      {
        name: '__stripe_mid',
        expiryKey: 'year',
        expiryParams: { count: 1 },
        descriptionKey: 'stripeMidDesc',
        provider: 'Stripe',
      },
      {
        name: '__stripe_sid',
        expiryKey: 'minutes',
        expiryParams: { count: 30 },
        descriptionKey: 'stripeSidDesc',
        provider: 'Stripe',
      },
    ],
  },
  {
    id: 'analytics',
    cookies: [
      {
        name: '_ga',
        expiryKey: 'years',
        expiryParams: { count: 2 },
        descriptionKey: 'gaDesc',
        provider: 'Google Analytics',
        learnMoreUrl: 'https://policies.google.com/technologies/cookies',
      },
      {
        name: '_ga_*',
        expiryKey: 'years',
        expiryParams: { count: 2 },
        descriptionKey: 'gaStarDesc',
        provider: 'Google Analytics',
      },
      {
        name: '_gid',
        expiryKey: 'hours',
        expiryParams: { count: 24 },
        descriptionKey: 'gidDesc',
        provider: 'Google Analytics',
      },
      {
        name: '_bs_uid',
        expiryKey: 'year',
        expiryParams: { count: 1 },
        descriptionKey: 'bsUidDesc',
        provider: 'Better Stack',
      },
      {
        name: '_bs_sid',
        expiryKey: 'session',
        descriptionKey: 'bsSidDesc',
        provider: 'Better Stack',
      },
    ],
  },
];
