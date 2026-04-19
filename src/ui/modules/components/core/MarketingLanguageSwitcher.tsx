'use client';

import { usePathname, useRouter } from '@application/i18n/navigtion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@ui/components/animate/base/dropdown-menu';
import { Button } from '@ui/components/animate/components/buttons/button';
import { Check } from '@ui/components/animate/icons/check';
import { AnimateIcon } from '@ui/components/animate/icons/icon';
import { useLanguages } from '@ui/hooks/useLanguages';
import { useLocale } from 'next-intl';
import { useCallback, useMemo } from 'react';

export const MarketingLanguageSwitcher = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const languages = useLanguages();

  const handleChange = useCallback(
    (newLocale: string) => {
      router.push(pathname, { locale: newLocale });
    },
    [pathname, router]
  );

  const current = useMemo(() => languages.find(({ code }) => code === locale), [languages, locale]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <AnimateIcon animateOnHover>
          <Button variant='outline' size='sm' className='font-semibold text-xs'>
            {current?.label ?? locale}
          </Button>
        </AnimateIcon>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {languages.map((lang) => (
          <AnimateIcon animateOnHover key={lang.code}>
            <DropdownMenuItem className='flex justify-between gap-4' onClick={() => handleChange(lang.code)}>
              <span>{lang.label}</span>
              {lang.code === locale && <Check className='h-4 w-4' />}
            </DropdownMenuItem>
          </AnimateIcon>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
