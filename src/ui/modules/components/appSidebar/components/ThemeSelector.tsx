'use client';

import { Check, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useCallback } from 'react';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'src/components/animate-ui/radix/dropdown-menu';

export const ThemeSelector = () => {
  const { setTheme, themes, theme: currentTheme, resolvedTheme } = useTheme();
  const t = useTranslations('theme');

  const startViewTransition = useCallback((updateFn: () => void) => {
    if ('startViewTransition' in document) {
      (document as any).startViewTransition(updateFn);
    } else {
      updateFn();
    }
  }, []);

  const getResolvedTheme = (theme: ReturnType<typeof useTheme>['theme']) => {
    if (theme !== 'system') return theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const changeTheme = useCallback(
    (newTheme: string) => {
      const newResolvedTheme = getResolvedTheme(newTheme);

      if (newResolvedTheme === resolvedTheme) {
        setTheme(newTheme);
        return;
      }

      startViewTransition(() => {
        setTheme(newTheme);
      });
    },
    [setTheme, startViewTransition, resolvedTheme]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='icon' className='w-full focus-visible:ring-1'>
          <Sun className='h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
          <Moon className='absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
          <span className='sr-only'>Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {themes.map((theme) => {
          return (
            <DropdownMenuItem key={theme} className={'flex justify-between'} onClick={() => changeTheme(theme)}>
              {t(theme as Parameters<typeof t>[0])}
              {currentTheme === theme && <Check className='h-4 w-4' />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
