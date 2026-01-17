'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as CookieConsentLib from 'vanilla-cookieconsent';

import { CookieConsentDialog } from './CookieConsentDialog';

export const CookieConsent = () => {
  const initialized = useRef(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  const updateGtagConsent = useCallback((granted: boolean) => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('consent', 'update', { analytics_storage: granted ? 'granted' : 'denied' });
      if (granted) {
        window.gtag('event', 'page_view');
      }
    }
  }, []);

  const saveConsent = useCallback(
    (analytics: boolean) => {
      CookieConsentLib.acceptCategory(analytics ? 'analytics' : []);
      updateGtagConsent(analytics);
      setShowBanner(false);
      setShowPreferences(false);
    },
    [updateGtagConsent]
  );

  const handleAcceptAll = useCallback(() => {
    setAnalyticsEnabled(true);
    saveConsent(true);
  }, [saveConsent]);

  const handleRejectAll = useCallback(() => {
    setAnalyticsEnabled(false);
    saveConsent(false);
  }, [saveConsent]);

  const handleSave = useCallback(() => {
    saveConsent(analyticsEnabled);
  }, [analyticsEnabled, saveConsent]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    CookieConsentLib.run({
      autoShow: false,
      categories: {
        necessary: { enabled: true, readOnly: true },
        analytics: {
          autoClear: { cookies: [{ name: /^_ga/ }, { name: '_gid' }] },
        },
      },
      language: { default: 'en', translations: { en: {} } },
      onConsent: () => {
        const granted = CookieConsentLib.acceptedCategory('analytics');
        setAnalyticsEnabled(granted);
        updateGtagConsent(granted);
      },
      onChange: ({ changedCategories }) => {
        if (changedCategories.includes('analytics')) {
          const granted = CookieConsentLib.acceptedCategory('analytics');
          setAnalyticsEnabled(granted);
          updateGtagConsent(granted);
        }
      },
    });

    const existingConsent = CookieConsentLib.getCookie();
    if (!existingConsent || Object.keys(existingConsent).length === 0) {
      setShowBanner(true);
    } else {
      setAnalyticsEnabled(CookieConsentLib.acceptedCategory('analytics'));
    }

    const handleShowPreferences = () => setShowPreferences(true);
    window.addEventListener('cc:showPreferences', handleShowPreferences);
    return () => window.removeEventListener('cc:showPreferences', handleShowPreferences);
  }, [updateGtagConsent]);

  if (showBanner) {
    return (
      <div className='fixed bottom-4 left-4 z-50 max-w-md rounded-lg border bg-popover p-6 shadow-lg'>
        <h3 className='text-lg font-semibold'>We use cookies</h3>
        <p className='mt-2 text-sm text-muted-foreground'>
          We use essential cookies for basic website functionality and analytics cookies to understand how you interact
          with our site.
        </p>
        <div className='mt-4 flex flex-wrap gap-2'>
          <button
            onClick={handleRejectAll}
            className='rounded-md border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:opacity-90'
          >
            Reject all
          </button>
          <button
            onClick={() => {
              setShowBanner(false);
              setShowPreferences(true);
            }}
            className='rounded-md border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:opacity-90'
          >
            Manage preferences
          </button>
          <button
            onClick={handleAcceptAll}
            className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90'
          >
            Accept all
          </button>
        </div>
      </div>
    );
  }

  return (
    <CookieConsentDialog
      open={showPreferences}
      onOpenChange={setShowPreferences}
      analyticsEnabled={analyticsEnabled}
      onAnalyticsChange={setAnalyticsEnabled}
      onAcceptAll={handleAcceptAll}
      onRejectAll={handleRejectAll}
      onSave={handleSave}
    />
  );
};
