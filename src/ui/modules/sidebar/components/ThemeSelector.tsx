'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@ui/modules/core/animate/base/DropdownMenu';
import { Check } from '@ui/modules/core/animate/icons/Check';
import { AnimateIcon } from '@ui/modules/core/animate/icons/Icon';
import { Moon } from '@ui/modules/core/animate/icons/Moon';
import { Sun } from '@ui/modules/core/animate/icons/Sun';
import { Button } from '@ui/modules/core/primitives/Button';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';

export const ThemeSelector = ({ buttonClassName }: { buttonClassName?: string }) => {
  const { setTheme, themes, theme: currentTheme } = useTheme();
  const t = useTranslations('theme');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <AnimateIcon animateOnHover asChild>
          <Button variant='outline' size='icon' className={buttonClassName ?? 'w-full !h-11 focus-visible:ring-1'}>
            <Sun className='h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
            <Moon className='absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
            <span className='sr-only'>{t('toggleTheme')}</span>
          </Button>
        </AnimateIcon>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {/* TODO: implement animateIcon — AnimateIcon.onMouseEnter fires setLocalAnimate → React re-render mid touch-event chain → base-ui loses internal state → freeze. Fix: use onPointerEnter + pointerType==='mouse' guard in AnimateIcon so touch never triggers the re-render */}
        {themes.map((theme) => (
          <DropdownMenuItem key={theme} className='flex justify-between' onClick={() => setTheme(theme)}>
            {t(theme as Parameters<typeof t>[0])}
            {currentTheme === theme && <Check className='h-4 w-4' />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
