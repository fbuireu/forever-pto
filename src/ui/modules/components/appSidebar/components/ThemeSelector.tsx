'use client';

import { Button } from '@const/components/ui/button';
import { Check, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'src/components/animate-ui/radix/dropdown-menu';

export const ThemeSelector = () => {
  const { setTheme, themes, theme: currentTheme } = useTheme();
  const t = useTranslations('theme');

  const changeTheme = (theme: string) => {
    setTheme(theme);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='icon' className='w-full'>
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
