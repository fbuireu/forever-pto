'use client';

import { Button } from '@const/components/ui/button';
import { cn } from '@const/lib/utils';
import { useLanguages } from '@ui/hooks/useLanguages';
import { Check } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'src/components/animate-ui/radix/dropdown-menu';
import { useSidebar } from 'src/components/animate-ui/radix/sidebar';

export const LanguageSelector = () => {
  const t = useTranslations('languages');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useSidebar();
  const languages = useLanguages();

  const handleLanguageChange = (newLocale: string) => {
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPathname);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='icon' className='w-full'>
          <span className='capitalize'>{state === 'collapsed' ? locale : t(locale)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            className={cn('flex justify-between', locale === language.code && 'bg-accent')}
            onClick={() => handleLanguageChange(language.code)}
          >
            <span>{language.label}</span>
            {language.code === locale && <Check className='h-4 w-4' />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
