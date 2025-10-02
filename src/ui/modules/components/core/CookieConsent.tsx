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
import { useCookieConsent } from '@ui/hooks/useCookieConsent';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { getCookie } from 'vanilla-cookieconsent';
import { updateDarkMode } from '../footer/components/utils/helpers';
import { CookieConsentDialog } from './CookieConsentDialog';

export const CookieConsent = () => {
  const { resolvedTheme } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const { analyticsEnabled, setAnalyticsEnabled, handleAcceptAll, handleRejectAll, handleSavePreferences } =
    useCookieConsent();

  useEffect(() => {
    updateDarkMode(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    const cookie = getCookie();
    if (!cookie) {
      setShowModal(true);
    }
  }, []);

  const onAcceptAll = () => {
    handleAcceptAll();
    setShowModal(false);
    setShowPreferences(false);
  };

  const onRejectAll = () => {
    handleRejectAll();
    setShowModal(false);
    setShowPreferences(false);
  };

  const onSave = () => {
    handleSavePreferences();
    setShowModal(false);
    setShowPreferences(false);
  };

  return (
    <>
      <Dialog open={showModal && !showPreferences} onOpenChange={setShowModal}>
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
            <Button variant='secondary' onClick={() => setShowPreferences(true)} className='w-full sm:w-auto'>
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
