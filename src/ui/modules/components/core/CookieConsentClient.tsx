'use client';

import dynamic from 'next/dynamic';

const CookieConsent = dynamic(
  () => import('@ui/modules/components/core/CookieConsent').then((m) => ({ default: m.CookieConsent })),
  { ssr: false }
);

export function CookieConsentClient() {
  return <CookieConsent />;
}
