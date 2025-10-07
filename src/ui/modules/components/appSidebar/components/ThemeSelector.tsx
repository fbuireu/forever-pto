'use client';

import {useTranslations} from 'next-intl';
import {useTheme} from 'next-themes';
import {useCallback} from 'react';
import {Button} from 'src/components/animate-ui/components/buttons/button';
import { Sun } from 'src/components/animate-ui/icons/sun';
import { Moon } from 'src/components/animate-ui/icons/moon';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from 'src/components/animate-ui/radix/dropdown-menu';
import { Check } from 'src/components/animate-ui/icons/check';

export const ThemeSelector = () => {
    const {setTheme, themes, theme: currentTheme, resolvedTheme} = useTheme();
    const t = useTranslations('theme');

    const startViewTransition = useCallback((callback: () => void) => {
        if ('startViewTransition' in document) {
            document.startViewTransition(callback);
        } else {
            callback();
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

            startViewTransition(() => setTheme(newTheme));
        },
        [setTheme, startViewTransition, resolvedTheme]
    );

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant='outline' size='icon' className='w-full focus-visible:ring-1'>
                    <Sun animateOnHover
                        className='h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0'/>
                    <Moon animateOnHover
                        className='absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100'/>
                    <span className='sr-only'>Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
                {themes.map((theme) => (
                    <DropdownMenuItem key={theme} className={'flex justify-between'} onClick={() => changeTheme(theme)}>
                        {t(theme as Parameters<typeof t>[0])}
                        {currentTheme === theme && <Check className='h-4 w-4' animateOnHover />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
