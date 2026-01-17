'use client';

import { Button } from '@const/components/ui/button';
import { useCookieConsent } from '@ui/hooks/useCookieConsent';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const CookieConsentDialog = dynamic(() =>
  import('../../core/CookieConsentDialog').then((module) => ({ default: module.CookieConsentDialog }))
);

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
        className='text-muted-foreground -ml-2 font-normal'
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
