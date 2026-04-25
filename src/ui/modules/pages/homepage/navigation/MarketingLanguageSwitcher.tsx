'use client';

import { usePathname, useRouter } from '@application/i18n/navigtion';
import { usePremiumStore } from '@application/stores/premium';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@ui/modules/core/animate/base/DropdownMenu';
import { Button } from '@ui/modules/core/animate/components/buttons/Button';
import { Check } from '@ui/modules/core/animate/icons/Check';
import { AnimateIcon } from '@ui/modules/core/animate/icons/Icon';
import { useLanguages } from '@ui/hooks/useLanguages';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo } from 'react';

export const MarketingLanguageSwitcher = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const languages = useLanguages();
  const t = useTranslations('accessibility');
  const getCurrencyFromLocale = usePremiumStore((state) => state.getCurrencyFromLocale);

  const handleLanguageChange = useCallback(
    (newLocale: string) => {
      const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
      router.push(newPathname, { locale: newLocale });
    },
    [pathname, locale, router]
  );

  useEffect(() => {
    getCurrencyFromLocale(locale);
  }, [locale, getCurrencyFromLocale]);

  const currentLanguage = useMemo(() => languages.find(({ code }) => code === locale), [languages, locale]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <AnimateIcon animateOnHover>
          <Button
            variant='outline'
            size='sm'
            className='focus-visible:ring-1'
            aria-label={t('selectLanguage', { current: currentLanguage?.label ?? locale })}
          >
            <span className='capitalize'>{currentLanguage?.label}</span>
          </Button>
        </AnimateIcon>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {languages.map((language) => (
          <AnimateIcon animateOnHover key={language.code}>
            <DropdownMenuItem className='flex justify-between' onClick={() => handleLanguageChange(language.code)}>
              <span>{language.label}</span>
              {language.code === locale && <Check className='h-4 w-4' />}
            </DropdownMenuItem>
          </AnimateIcon>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
