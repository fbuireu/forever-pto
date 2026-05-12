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
import { useSidebar } from '@ui/modules/core/animate/base/Sidebar';
import { Check } from '@ui/modules/core/animate/icons/Check';
import { AnimateIcon } from '@ui/modules/core/animate/icons/Icon';
import { Button } from '@ui/modules/core/primitives/Button';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

export const LanguageSelector = () => {
  const locale = useLocale();
  const { push } = useRouter();
  const pathname = usePathname();
  const { state } = useSidebar();
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
  const displayText = state === 'collapsed' ? currentLanguage?.code : currentLanguage?.label;

  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <AnimateIcon animateOnHover asChild>
          <Button
            variant='outline'
            size='icon'
            className='w-full h-11! focus-visible:ring-1'
            aria-label={t('selectLanguage', { current: currentLanguage?.label ?? locale })}
          >
            <span className='capitalize'>{displayText}</span>
          </Button>
        </AnimateIcon>
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
