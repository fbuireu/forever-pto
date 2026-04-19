'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@ui/components/animate/base/dropdown-menu';
import { Button } from '@ui/components/animate/components/buttons/button';
import { Check } from '@ui/components/animate/icons/check';
import { AnimateIcon } from '@ui/components/animate/icons/icon';
import { Moon } from '@ui/components/animate/icons/moon';
import { Sun } from '@ui/components/animate/icons/sun';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useCallback } from 'react';

const getResolvedTheme = (theme: ReturnType<typeof useTheme>['theme']) => {
  if (theme !== 'system') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const ThemeSelector = ({ buttonClassName }: { buttonClassName?: string }) => {
  const { setTheme, themes, theme: currentTheme, resolvedTheme } = useTheme();
  const t = useTranslations('theme');

  const startViewTransition = useCallback((callback: () => void) => {
    if ('startViewTransition' in document) {
      document.startViewTransition(callback);
    } else {
      callback();
    }
  }, []);

  const changeTheme = useCallback(
    (newTheme: string) => {
      const newResolvedTheme = getResolvedTheme(newTheme);

      if (newResolvedTheme === resolvedTheme) {
        setTheme(newTheme);
        return;
      }

      startViewTransition(() => setTheme(newTheme));
    },
    [setTheme, startViewTransition, resolvedTheme]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <AnimateIcon animateOnHover>
          <Button variant='outline' size='icon' className={buttonClassName ?? 'w-full !h-11 focus-visible:ring-1'}>
            <Sun className='h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
            <Moon className='absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
            <span className='sr-only'>{t('toggleTheme')}</span>
          </Button>
        </AnimateIcon>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {themes.map((theme) => (
          <AnimateIcon animateOnHover key={theme}>
            <DropdownMenuItem className={'flex justify-between'} onClick={() => changeTheme(theme)}>
              {t(theme as Parameters<typeof t>[0])}
              {currentTheme === theme && <Check className='h-4 w-4' animateOnHover />}
            </DropdownMenuItem>
          </AnimateIcon>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
