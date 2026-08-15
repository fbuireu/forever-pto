'use client';

import { EN } from '@infrastructure/i18n/locales';
import { Button } from '@ui/modules/core/primitives/Button';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as CookieConsentLib from 'vanilla-cookieconsent';

import { CookieConsentDialog } from './CookieConsentDialog';
import {
  ANALYTICS_CATEGORY,
  allAnalyticsServices,
  consentedAnalyticsServices,
  GOOGLE_ANALYTICS_SERVICE_ID,
} from './utils/consent';

const allServicesEnabled = allAnalyticsServices(true);
const allServicesDisabled = allAnalyticsServices(false);

export const CookieConsent = () => {
  const t = useTranslations('cookies');
  const initialized = useRef(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [serviceStates, setServiceStates] = useState<Record<string, boolean>>(allServicesDisabled);

  const analyticsEnabled = Object.values(serviceStates).some(Boolean);

  const updateGtagConsent = useCallback((granted: boolean) => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('consent', 'update', { analytics_storage: granted ? 'granted' : 'denied' });
      if (granted) {
        window.gtag('event', 'page_view');
      }
    }
  }, []);

  const saveConsent = useCallback(
    (services: Record<string, boolean>) => {
      const enabledServices = Object.entries(services)
        .filter(([, v]) => v)
        .map(([k]) => k);
      CookieConsentLib.acceptService(enabledServices, ANALYTICS_CATEGORY);
      updateGtagConsent(enabledServices.includes(GOOGLE_ANALYTICS_SERVICE_ID));
      setShowBanner(false);
      setShowPreferences(false);
    },
    [updateGtagConsent]
  );

  const handleAcceptAll = useCallback(() => {
    setServiceStates(allServicesEnabled);
    saveConsent(allServicesEnabled);
  }, [saveConsent]);

  const handleRejectAll = useCallback(() => {
    setServiceStates(allServicesDisabled);
    saveConsent(allServicesDisabled);
  }, [saveConsent]);

  const handleSave = useCallback(() => {
    saveConsent(serviceStates);
  }, [serviceStates, saveConsent]);

  const handleAnalyticsChange = useCallback((checked: boolean) => {
    setServiceStates(checked ? allServicesEnabled : allServicesDisabled);
  }, []);

  const handleServiceChange = useCallback((serviceId: string, checked: boolean) => {
    setServiceStates((prev) => ({ ...prev, [serviceId]: checked }));
  }, []);

  const syncFromLibrary = useCallback(() => {
    const consented = consentedAnalyticsServices();
    setServiceStates(consented);
    updateGtagConsent(consented[GOOGLE_ANALYTICS_SERVICE_ID] === true);
  }, [updateGtagConsent]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    CookieConsentLib.run({
      autoShow: false,
      categories: {
        necessary: { enabled: true, readOnly: true },
        analytics: {
          services: {
            ga4: { cookies: [{ name: /^_ga/ }, { name: '_gid' }] },
            betterStack: { cookies: [{ name: /^_bs/ }] },
          },
          autoClear: { cookies: [{ name: /^_ga/ }, { name: '_gid' }, { name: /^_bs/ }] },
        },
      },
      language: {
        default: EN,
        translations: { [EN]: { consentModal: { title: t('title') }, preferencesModal: { sections: [] } } },
      },
      onConsent: syncFromLibrary,
      onChange: ({ changedCategories }) => {
        if (changedCategories.includes(ANALYTICS_CATEGORY)) syncFromLibrary();
      },
    });

    const existingConsent = CookieConsentLib.getCookie();
    if (!existingConsent || Object.keys(existingConsent).length === 0) {
      setShowBanner(true);
    } else {
      setServiceStates(consentedAnalyticsServices());
    }

    const handleShowPreferences = () => {
      setShowBanner(false);
      setShowPreferences(true);
    };
    window.addEventListener('cc:showPreferences', handleShowPreferences);
    return () => window.removeEventListener('cc:showPreferences', handleShowPreferences);
  }, [syncFromLibrary, t]);

  if (showBanner) {
    return (
      <div
        role='dialog'
        aria-labelledby='cookie-banner-title'
        aria-describedby='cookie-banner-description'
        className='fixed bottom-4 inset-x-4 sm:right-auto z-9999 sm:max-w-2xl rounded-[14px] border-[3px] border-(--frame) bg-card p-5 sm:p-8 shadow-(--shadow-brutal-lg)'
      >
        <h3 id='cookie-banner-title' className='text-lg sm:text-xl font-semibold tracking-[-0.03em]'>
          {t('title')}
        </h3>
        <p id='cookie-banner-description' className='mt-2 text-xs sm:text-sm text-muted-foreground'>
          {t('description')}
        </p>
        <div className='mt-4 flex flex-wrap gap-2'>
          <Button variant='destructive' onClick={handleRejectAll}>
            {t('rejectAll')}
          </Button>
          <Button
            variant='secondary'
            onClick={() => {
              setShowBanner(false);
              setShowPreferences(true);
            }}
          >
            {t('managePreferences')}
          </Button>
          <Button variant='success' onClick={handleAcceptAll}>
            {t('acceptAll')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <CookieConsentDialog
      open={showPreferences}
      onOpenChange={setShowPreferences}
      analyticsEnabled={analyticsEnabled}
      onAnalyticsChange={handleAnalyticsChange}
      serviceStates={serviceStates}
      onServiceChange={handleServiceChange}
      onAcceptAll={handleAcceptAll}
      onRejectAll={handleRejectAll}
      onSave={handleSave}
    />
  );
};
