import { Link } from '@application/i18n/navigtion';
import { getTranslations } from 'next-intl/server';
import { ContactButton } from '../contact/ContactButton';
import { CookieButton } from './components/CookieButton';
import { DevFooter } from './components/DevFooter';

export const Footer = async () => {
  const t = await getTranslations('footer');

  return (
    <footer className='mt-10 w-full m-auto flex justify-center z-1 bg-transparent'>
      <div className='max-w-4xl w-full rounded-[1.5rem] border-[2.5px] border-[var(--frame)] bg-card shadow-[var(--shadow-brutal-lg)]'>
        <DevFooter />
        <nav
          aria-label={t('legalNavigation')}
          className='flex flex-col sm:flex-row justify-center items-center gap-3 py-6 px-4 max-w-4xl mx-auto'
        >
          <Link
            href='/legal/privacy-policy'
            className='text-sm font-medium text-muted-foreground underline-offset-4 hover:underline'
          >
            {t('privacyPolicy')}
          </Link>
          <Link
            href='/legal/terms-of-service'
            className='text-sm font-medium text-muted-foreground underline-offset-4 hover:underline'
          >
            {t('termsOfService')}
          </Link>
          <Link
            href='/legal/cookie-policy'
            className='text-sm font-medium text-muted-foreground underline-offset-4 hover:underline'
          >
            {t('cookiePolicy')}
          </Link>
          <Link
            href='/legal/legal-notice'
            className='text-sm font-medium text-muted-foreground underline-offset-4 hover:underline'
          >
            {t('legalNotice')}
          </Link>
          <CookieButton />
          <ContactButton />
        </nav>
      </div>
    </footer>
  );
};
