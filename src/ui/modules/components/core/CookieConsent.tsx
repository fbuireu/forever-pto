'use client';

import { Button } from '@const/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@const/components/ui/dialog';
import { useCookieConsent } from '@ui/context/CookieConsentContext';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useState } from 'react';
import { updateDarkMode } from '../footer/components/utils/helpers';
import { CookieConsentDialog } from './CookieConsentDialog';

export const CookieConsent = () => {
  const { resolvedTheme } = useTheme();
  const [showPreferences, setShowPreferences] = useState(false);
  const {
    showConsentModal,
    setShowConsentModal,
    analyticsEnabled,
    setAnalyticsEnabled,
    handleAcceptAll,
    handleRejectAll,
    handleSavePreferences,
  } = useCookieConsent();

  useEffect(() => {
    updateDarkMode(resolvedTheme);
  }, [resolvedTheme]);

  const closeModals = useCallback(() => {
    setShowConsentModal(false);
    setShowPreferences(false);
  }, [setShowConsentModal]);

  const onAcceptAll = useCallback(() => {
    handleAcceptAll();
    closeModals();
  }, [handleAcceptAll, closeModals]);

  const onRejectAll = useCallback(() => {
    handleRejectAll();
    closeModals();
  }, [handleRejectAll, closeModals]);

  const onSave = useCallback(() => {
    handleSavePreferences();
    closeModals();
  }, [handleSavePreferences, closeModals]);

  const openPreferences = useCallback(() => {
    setShowPreferences(true);
  }, []);

  return (
    <>
      <Dialog open={showConsentModal && !showPreferences} onOpenChange={setShowConsentModal}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>We use cookies</DialogTitle>
            <DialogDescription>
              We use essential cookies for basic website functionality and analytics cookies to understand how you
              interact with our site. Analytics cookies will only be set with your consent.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='flex-col sm:flex-row gap-2'>
            <Button variant='outline' onClick={onRejectAll} className='w-full sm:w-auto'>
              Reject all
            </Button>
            <Button variant='secondary' onClick={openPreferences} className='w-full sm:w-auto'>
              Manage preferences
            </Button>
            <Button onClick={onAcceptAll} className='w-full sm:w-auto'>
              Accept all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
