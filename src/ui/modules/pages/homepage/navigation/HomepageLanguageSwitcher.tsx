'use client';

import { usePathname, useRouter } from '@application/i18n/navigation';
import { usePremiumStore } from '@application/stores/premium';
import { useLanguages } from '@ui/hooks/useLanguages';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@ui/modules/core/animate/base/DropdownMenu';
import { Check } from '@ui/modules/core/animate/icons/Check';
import { Button } from '@ui/modules/core/primitives/Button';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo } from 'react';

export const HomepageLanguageSwitcher = () => {
  const locale = useLocale();
  const { push } = useRouter();
  const pathname = usePathname();
  const languages = useLanguages();
  const t = useTranslations('accessibility');
  const getCurrencyFromLocale = usePremiumStore((state) => state.getCurrencyFromLocale);

  const handleLanguageChange = useCallback(
    (newLocale: string) => {
      const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
      push(newPathname, { locale: newLocale, scroll: false });
    },
    [pathname, locale, push]
  );

  useEffect(() => {
    getCurrencyFromLocale(locale);
  }, [locale, getCurrencyFromLocale]);

  const currentLanguage = useMemo(() => languages.find(({ code }) => code === locale), [languages, locale]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='focus-visible:ring-1'
          aria-label={t('selectLanguage', { current: currentLanguage?.label ?? locale })}
        >
          <span className='capitalize'>{currentLanguage?.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            className='flex justify-between'
            onClick={() => handleLanguageChange(language.code)}
          >
            <span>{language.label}</span>
            {language.code === locale && <Check className='size-4' />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
