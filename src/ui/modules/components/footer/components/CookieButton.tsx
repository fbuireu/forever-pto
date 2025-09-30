'use client';

import { Button } from '@const/components/ui/button';
import { useCookieConsent } from '@ui/hooks/useCookieConsent';
import { useState } from 'react';
import { CookieConsentDialog } from '../../core/CookieConsentDialog';

export const CookieButton = () => {
  const [showPreferences, setShowPreferences] = useState(false);
  const { analyticsEnabled, setAnalyticsEnabled, handleAcceptAll, handleRejectAll, handleSavePreferences } =
    useCookieConsent();

  const onAcceptAll = () => {
    handleAcceptAll();
    setShowPreferences(false);
  };

  const onRejectAll = () => {
    handleRejectAll();
    setShowPreferences(false);
  };

  const onSave = () => {
    handleSavePreferences();
    setShowPreferences(false);
  };

  return (
    <>
      <Button
        variant='ghost'
        className='cookies_consent_button --is-clickable --underline-on-hover'
        onClick={() => setShowPreferences(true)}
      >
        Manage cookies
      </Button>

      <CookieConsentDialog
        open={showPreferences}
        onOpenChange={setShowPreferences}
        analyticsEnabled={analyticsEnabled}
        onAnalyticsChange={setAnalyticsEnabled}
        onAcceptAll={onAcceptAll}
        onRejectAll={onRejectAll}
        onSave={onSave}
      />
    </>
  );
};
