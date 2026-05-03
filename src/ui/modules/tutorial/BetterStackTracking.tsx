'use client';

import { identifyUser } from '@infrastructure/clients/logging/better-stack/tracking';
import { usePremiumStore } from '@application/stores/premium';
import Script from 'next/script';
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import * as CookieConsentLib from 'vanilla-cookieconsent';

const TRACKING_TOKEN = process.env.NEXT_PUBLIC_BETTER_STACK_TRACKING_TOKEN;
const ENV = process.env.NODE_ENV;

export const BetterStackTracking = () => {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  const { userEmail, premiumKey } = usePremiumStore(
    useShallow((state) => ({
      userEmail: state.userEmail,
      premiumKey: state.premiumKey,
    }))
  );

  useEffect(() => {
    setAnalyticsEnabled(CookieConsentLib.acceptedCategory('analytics'));

    const handleConsentChange = () => {
      setAnalyticsEnabled(CookieConsentLib.acceptedCategory('analytics'));
    };

    document.addEventListener('cc:onConsent', handleConsentChange);
    document.addEventListener('cc:onChange', handleConsentChange);

    return () => {
      document.removeEventListener('cc:onConsent', handleConsentChange);
      document.removeEventListener('cc:onChange', handleConsentChange);
    };
  }, []);

  useEffect(() => {
    if (!analyticsEnabled || !userEmail) return;
    identifyUser(userEmail, premiumKey ? 'premium' : 'free');
  }, [analyticsEnabled, userEmail, premiumKey]);

  if (!TRACKING_TOKEN || !analyticsEnabled) return null;

  return (
    <Script id='betterstack-tracking' strategy='afterInteractive'>
      {`
        !function(b,e,t,r){
          b[t]=b[t]||function(){(b[t].q=b[t].q||[]).push(arguments)};
          b[t].l=+new Date;
          var s=e.createElement('script'); s.async=1; s.crossOrigin='anonymous';
          s.src='https://betterstack.net/b.js?t='+r;
          (e.head||e.getElementsByTagName('head')[0]).appendChild(s);
        }(window,document,'betterstack','${TRACKING_TOKEN}');
        betterstack('init', { environment: '${ENV}' });
      `}
    </Script>
  );
};
