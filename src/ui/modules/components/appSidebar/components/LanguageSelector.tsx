'use client';

import { usePathname, useRouter } from '@infrastructure/i18n/navigation';
import { usePremiumStore } from '@ui/store/premium';
import { useLanguages } from '@ui/hooks/useLanguages';
import { useLocale } from 'next-intl';
import { useCallback, useEffect, useMemo } from 'react';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import { Check } from 'src/components/animate-ui/icons/check';
import { AnimateIcon } from 'src/components/animate-ui/icons/icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'src/components/animate-ui/radix/dropdown-menu';
import { useSidebar } from 'src/components/animate-ui/radix/sidebar';

export const LanguageSelector = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useSidebar();
  const languages = useLanguages();
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
        <Button variant='outline' size='icon' className='w-full focus-visible:ring-1'>
          <span className='capitalize'>{displayText}</span>
        </Button>
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
