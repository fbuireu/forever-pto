'use client';

import { Button } from '@const/components/ui/button';
import { useTranslations } from 'next-intl';

export const CookieButton = () => {
  const t = useTranslations('footer');

  const handleClick = () => {
    globalThis.dispatchEvent(new CustomEvent('cc:showPreferences'));
  };

  return (
    <Button variant='ghost' className='text-muted-foreground -ml-2 font-normal' onClick={handleClick}>
      {t('manageCookies')}
    </Button>
  );
};
