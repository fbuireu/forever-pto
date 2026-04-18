'use client';

import { usePathname, useRouter } from '@application/i18n/navigtion';
import { usePremiumStore } from '@application/stores/premium';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@ui/components/animate/base/dropdown-menu';
import { useSidebar } from '@ui/components/animate/base/sidebar';
import { Button } from '@ui/components/animate/components/buttons/button';
import { Check } from '@ui/components/animate/icons/check';
import { AnimateIcon } from '@ui/components/animate/icons/icon';
import { useLanguages } from '@ui/hooks/useLanguages';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo } from 'react';

export const LanguageSelector = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useSidebar();
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
  const displayText = state === 'collapsed' ? currentLanguage?.code : currentLanguage?.label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <AnimateIcon animateOnHover>
          <Button
            variant='outline'
            size='icon'
            className='w-full !h-11 focus-visible:ring-1'
            aria-label={t('selectLanguage', { current: currentLanguage?.label ?? locale })}
          >
            <span className='capitalize'>{displayText}</span>
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
