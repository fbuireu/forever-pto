'use client';

import { usePathname, useRouter } from '@application/i18n/navigtion';
import { usePremiumStore } from '@application/stores/premium';
import { useLanguages } from '@ui/hooks/useLanguages';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect } from 'react';
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
import { useShallow } from 'zustand/react/shallow';

export const LanguageSelector = () => {
  const t = useTranslations('languages');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useSidebar();
  const languages = useLanguages();

  const { getCurrencyFromLocale } = usePremiumStore(
    useShallow((state) => ({
      getCurrencyFromLocale: state.getCurrencyFromLocale,
    }))
  );

  const handleLanguageChange = (newLocale: string) => {
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPathname, { locale: newLocale });
  };
  
  useEffect(() => {
    getCurrencyFromLocale(locale);
  }, [locale, getCurrencyFromLocale]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='icon' className='w-full focus-visible:ring-1'>
          <span className='capitalize'>
            {state === 'collapsed'
              ? languages.find(({ code }) => code === locale)?.code
              : languages.find(({ code }) => code === locale)?.label}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {languages.map((language) => (
          <AnimateIcon animateOnHover key={language.code}>
            <DropdownMenuItem className={'flex justify-between'} onClick={() => handleLanguageChange(language.code)}>
              <span>{language.label}</span>
              {language.code === locale && <Check className='h-4 w-4' />}
            </DropdownMenuItem>
          </AnimateIcon>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
