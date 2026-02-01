import { Link } from '@infrastructure/i18n/navigation';
import { ContactButton } from '../contact/ContactButton';
import { CookieButton } from './components/CookieButton';
import { DevFooter } from './components/DevFooter';

export const Footer = () => (
  <footer className='mt-8 w-full border-t m-auto flex justify-center z-1 bg-background'>
    <section className='max-w-4xl w-full'>
      <DevFooter />
      <div className='flex flex-col sm:flex-row justify-center items-center gap-4 py-6 px-4 max-w-4xl mx-auto'>
        <Link href='/legal/privacy-policy' className='text-sm text-muted-foreground hover:underline'>
          Privacy Policy
        </Link>
        <Link href='/legal/terms-of-service' className='text-sm text-muted-foreground hover:underline'>
          Terms of Service
        </Link>
        <Link href='/legal/cookie-policy' className='text-sm text-muted-foreground hover:underline'>
          Cookie Policy
        </Link>
        <Link href='/legal/legal-notice' className='text-sm text-muted-foreground hover:underline'>
          Legal Notice
        </Link>
        <CookieButton />
        <ContactButton />
      </div>
    </section>
  </footer>
);
