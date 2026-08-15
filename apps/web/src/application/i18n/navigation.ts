import { routing } from '@infrastructure/i18n/routing';
import { createNavigation } from 'next-intl/navigation';

export const { Link, usePathname, useRouter } = createNavigation(routing);
