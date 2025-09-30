'use client';

import { useEffect, useState } from 'react';
import { acceptCategory, getCookie } from 'vanilla-cookieconsent';

const COOKIE_CATEGORY_NECESSARY = 'necessary';
const COOKIE_CATEGORY_ANALYTICS = 'analytics';
const COOKIE_CATEGORIES = [COOKIE_CATEGORY_NECESSARY, COOKIE_CATEGORY_ANALYTICS];

export const useCookieConsent = () => {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    const cookie = getCookie();
    if (cookie?.categories) {
      setAnalyticsEnabled(cookie.categories.includes(COOKIE_CATEGORY_ANALYTICS));
    }
  }, []);

  const handleAcceptAll = () => {
    acceptCategory(COOKIE_CATEGORIES);
    setAnalyticsEnabled(true);
  };

  const handleRejectAll = () => {
    acceptCategory([COOKIE_CATEGORY_NECESSARY]);
    setAnalyticsEnabled(false);
  };

  const handleSavePreferences = () => {
    if (analyticsEnabled) {
      acceptCategory(COOKIE_CATEGORIES);
    } else {
      acceptCategory([COOKIE_CATEGORY_NECESSARY]);
    }
  };

  return {
    analyticsEnabled,
    setAnalyticsEnabled,
    handleAcceptAll,
    handleRejectAll,
    handleSavePreferences,
  };
};
