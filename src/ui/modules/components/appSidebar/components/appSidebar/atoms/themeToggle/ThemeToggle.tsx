'use client';

import { Button } from '@ui/modules/components/core/button/Button';
import { DropdownMenu } from '@ui/modules/components/core/dropdownMenu/DropdownMenu';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  DropdownMenuTrigger,
} from '@modules/components/core/dropdownMenu/atoms/dropdownMenuTrigger/DropdownMenuTrigger';
import {
  DropdownMenuContent,
} from '@modules/components/core/dropdownMenu/atoms/dropdownMenuContent/DropdownMenuContent';
import { DropdownMenuItem } from '@modules/components/core/dropdownMenu/atoms/dropdownMenuItem/DropdownMenuItem';

export const ThemeToggle = () => {
  const { setTheme } = useTheme();

  return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon
                className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  );
};
