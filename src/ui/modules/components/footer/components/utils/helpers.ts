import { useTheme } from 'next-themes';

type Theme = ReturnType<typeof useTheme>['theme'];

export const getResolvedTheme = (theme: Theme) => {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
};

export const updateDarkMode = (theme: Theme) => {
  document.documentElement.classList.toggle('cc--darkmode', getResolvedTheme(theme) === 'dark');
};
