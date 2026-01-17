'use client';

import { Button } from '@const/components/ui/button';
import * as CookieConsentLib from 'vanilla-cookieconsent';

export const CookieButton = () => {
  const handleClick = () => {
    CookieConsentLib.showPreferences();
  };

  return (
    <Button variant="ghost" className="text-muted-foreground -ml-2 font-normal" onClick={handleClick}>
      Manage cookies
    </Button>
  );
};
