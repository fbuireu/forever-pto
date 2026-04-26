'use client';

import { Button } from '@ui/modules/core/primitives/Button';
import { useTranslations } from 'next-intl';

export const CookieButton = () => {
  const t = useTranslations('footer');

  const handleClick = () => {
    globalThis.dispatchEvent(new CustomEvent('cc:showPreferences'));
  };

  return (
    <Button
      variant='ghost'
      className='text-sm font-medium px-1.5 py-0.5 h-auto border-[2px] border-transparent rounded-[4px] hover:bg-[var(--accent)] hover:border-[var(--frame)] hover:text-foreground transition-all duration-75'
      onClick={handleClick}
    >
      {t('manageCookies')}
    </Button>
  );
};
