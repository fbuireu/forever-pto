import { Link } from '@application/i18n/navigtion';
import { getTranslations } from 'next-intl/server';
import { ContactButton } from '../contact/ContactButton';
import { CookieButton } from './components/CookieButton';
import { DevFooter } from './components/DevFooter';

export const Footer = async () => {
  const t = await getTranslations('footer');

  return (
    <footer className='mt-8 w-full border-t m-auto flex justify-center z-1 bg-background'>
      <section className='max-w-4xl w-full'>
        <DevFooter />
        <div className='flex flex-col sm:flex-row justify-center items-center gap-4 py-6 px-4 max-w-4xl mx-auto'>
          <Link href='/legal/privacy-policy' className='text-sm text-muted-foreground hover:underline'>
            {t('privacyPolicy')}
          </Link>
          <Link href='/legal/terms-of-service' className='text-sm text-muted-foreground hover:underline'>
            {t('termsOfService')}
          </Link>
          <Link href='/legal/cookie-policy' className='text-sm text-muted-foreground hover:underline'>
            {t('cookiePolicy')}
          </Link>
          <Link href='/legal/legal-notice' className='text-sm text-muted-foreground hover:underline'>
            {t('legalNotice')}
          </Link>
          <CookieButton />
          <ContactButton />
        </div>
      </section>
    </footer>
  );
};
