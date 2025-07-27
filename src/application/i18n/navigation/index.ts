import { routing } from '@infrastructure/i18n/routing';
import { createNavigation } from 'next-intl/navigation';
 
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);