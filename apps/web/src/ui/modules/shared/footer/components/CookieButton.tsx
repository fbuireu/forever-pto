'use client';

import { Button } from '@ui/modules/core/primitives/Button';
import { useTranslations } from 'next-intl';

export const CookieButton = () => {
  const t = useTranslations('footer');

  const showCookiePreferences = () => {
    globalThis.dispatchEvent(new CustomEvent('cc:showPreferences'));
  };

  return (
    <Button
      variant='ghost'
      className='text-sm font-medium px-1.5 py-0.5 h-auto border-[3px] border-transparent rounded-[8px] hover:bg-[var(--accent)] hover:border-[var(--frame)] hover:text-accent-foreground transition-[background-color,border-color,color] duration-75'
      onClick={showCookiePreferences}
    >
      {t('manageCookies')}
    </Button>
  );
};
