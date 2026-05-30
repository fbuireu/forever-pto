'use client';

import { EN } from '@infrastructure/i18n/locales';
import { Button } from '@ui/modules/core/primitives/Button';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as CookieConsentLib from 'vanilla-cookieconsent';

import { CookieConsentDialog } from './CookieConsentDialog';
import { COOKIE_SECTIONS } from './config/config';

const analyticsSection = COOKIE_SECTIONS.find((s) => s.id === 'analytics');
const analyticsServiceIds = analyticsSection?.services?.map((s) => s.id) ?? [];
const allServicesEnabled = Object.fromEntries(analyticsServiceIds.map((id) => [id, true]));
const allServicesDisabled = Object.fromEntries(analyticsServiceIds.map((id) => [id, false]));

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
      CookieConsentLib.acceptService(enabledServices, 'analytics');
      updateGtagConsent(enabledServices.length > 0);
      setShowBanner(false);
      setShowPreferences(false);
    },
    [updateGtagConsent],
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
      onConsent: () => {
        const prefs = CookieConsentLib.getUserPreferences();
        const acceptedServices = prefs.acceptedServices['analytics'] ?? [];
        setServiceStates(Object.fromEntries(analyticsServiceIds.map((id) => [id, acceptedServices.includes(id)])));
        updateGtagConsent(acceptedServices.length > 0);
      },
      onChange: ({ changedCategories }) => {
        if (changedCategories.includes('analytics')) {
          const prefs = CookieConsentLib.getUserPreferences();
          const acceptedServices = prefs.acceptedServices['analytics'] ?? [];
          setServiceStates(Object.fromEntries(analyticsServiceIds.map((id) => [id, acceptedServices.includes(id)])));
          updateGtagConsent(acceptedServices.length > 0);
        }
      },
    });

    const existingConsent = CookieConsentLib.getCookie();
    if (!existingConsent || Object.keys(existingConsent).length === 0) {
      setShowBanner(true);
    } else {
      const prefs = CookieConsentLib.getUserPreferences();
      const acceptedServices = prefs.acceptedServices['analytics'] ?? [];
      setServiceStates(Object.fromEntries(analyticsServiceIds.map((id) => [id, acceptedServices.includes(id)])));
    }

    const handleShowPreferences = () => setShowPreferences(true);
    window.addEventListener('cc:showPreferences', handleShowPreferences);
    return () => window.removeEventListener('cc:showPreferences', handleShowPreferences);
  }, [updateGtagConsent, t]);

  if (showBanner) {
    return (
      <div
        role='dialog'
        aria-labelledby='cookie-banner-title'
        aria-describedby='cookie-banner-description'
        className='fixed bottom-4 left-4 z-[9999] max-w-2xl rounded-[14px] border-[3px] border-[var(--frame)] bg-card p-8 shadow-[var(--shadow-brutal-lg)]'
      >
        <h3 id='cookie-banner-title' className='text-xl font-semibold tracking-[-0.03em]'>
          {t('title')}
        </h3>
        <p id='cookie-banner-description' className='mt-2 text-sm text-muted-foreground'>
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
