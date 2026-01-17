import { LegalLayout } from '@ui/modules/components/legal/LegalLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | Forever PTO',
  description: 'Information about how Forever PTO uses cookies and local storage',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CookiePolicyPage() {
  return (
    <LegalLayout title='Cookie Policy' lastUpdated='January 17, 2025'>
      <section>
        <h2 className='text-2xl font-semibold mt-6 mb-4'>1. Introduction</h2>
        <p>
          This Cookie Policy explains how Forever PTO uses cookies and similar storage technologies on our website{' '}
          <a href='https://forever-pto.com' className='text-primary hover:underline'>
            https://forever-pto.com
          </a>
          .
        </p>
        <p className='mt-4'>
          By using our website, you consent to the use of cookies and local storage as described in this policy. If
          you do not agree with our use of cookies, you should adjust your browser settings or refrain from using our
          website.
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>2. What Are Cookies?</h2>
        <p>
          Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit a
          website. They allow the website to recognize your device and remember certain information about your visit.
        </p>
        <p className='mt-4'>
          In addition to cookies, we also use browser local storage, which is a technology that allows websites to
          store data directly in your browser for persistent access across sessions.
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>3. Types of Cookies and Storage We Use</h2>
        <p>Forever PTO uses only technical and functional storage mechanisms. We do NOT use:</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>Advertising or marketing cookies</li>
          <li>Third-party tracking cookies</li>
          <li>Analytics cookies (unless you explicitly consent via our cookie banner)</li>
          <li>Social media cookies</li>
        </ul>

        <h3 className='text-xl font-semibold mt-6 mb-3'>3.1 Strictly Necessary Storage</h3>
        <p>
          These storage mechanisms are essential for the website to function properly. Without them, the application
          cannot provide its core features. They are stored in your browser&apos;s local storage and include:
        </p>
        <ul className='list-disc pl-6 mt-4 space-y-3'>
          <li>
            <strong>Application Filters:</strong> Stores your PTO configuration (number of days, country, region,
            year, optimization strategy, etc.)
          </li>
          <li>
            <strong>Holidays Data:</strong> Caches holiday information for your selected country and region to reduce
            API calls
          </li>
          <li>
            <strong>Location Settings:</strong> Remembers your country and region selection
          </li>
          <li>
            <strong>Premium Key:</strong> Stores your premium activation key (encrypted for security) if you&apos;ve
            activated premium features
          </li>
          <li>
            <strong>Theme Preferences:</strong> Remembers your dark/light mode selection
          </li>
          <li>
            <strong>Calendar State:</strong> Saves your custom holidays and manual PTO day selections
          </li>
        </ul>
        <p className='mt-4'>
          <strong>Duration:</strong> These are permanent storage items that remain in your browser until you
          explicitly clear them or uninstall the application.
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>4. Cookie Banner Consent</h2>
        <p>
          When you first visit Forever PTO, you&apos;ll see a cookie consent banner. This banner allows you to
          control optional cookies and tracking:
        </p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>
            <strong>Strictly Necessary:</strong> Cannot be disabled as they are essential for the website to function
          </li>
          <li>
            <strong>Analytics (Optional):</strong> If enabled, allows us to understand how users interact with the
            application to improve user experience
          </li>
        </ul>
        <p className='mt-4'>Your consent choices are stored in local storage and respected on all future visits.</p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>5. Google Consent Mode V2</h2>
        <p>
          Forever PTO implements Google Consent Mode V2, which ensures that analytics cookies and tracking only
          activate when you explicitly provide consent. This technology works by:
        </p>
        <ul className='list-disc pl-6 mt-4 space-y-3'>
          <li>
            <strong>Default State:</strong> When you first visit, Google Analytics loads but with all tracking
            categories set to &quot;denied&quot;. No personal data is collected.
          </li>
          <li>
            <strong>Consent Grant:</strong> When you accept analytics cookies, the consent state updates to
            &quot;granted&quot; immediately without requiring a page reload.
          </li>
          <li>
            <strong>Consent Denial:</strong> If you reject or later revoke analytics consent, tracking stops
            immediately and analytics cookies are blocked.
          </li>
          <li>
            <strong>Privacy-Preserving Pings:</strong> Even without consent, Google may receive anonymous pings
            (without personal data) to improve conversion modeling. These pings contain no identifying information.
          </li>
        </ul>
        <p className='mt-4'>The following consent categories are managed:</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>
            <strong>analytics_storage:</strong> Controlled by your cookie preferences (granted only if you accept
            analytics)
          </li>
          <li>
            <strong>ad_storage:</strong> Always denied (we don&apos;t use advertising)
          </li>
          <li>
            <strong>ad_user_data:</strong> Always denied
          </li>
          <li>
            <strong>ad_personalization:</strong> Always denied
          </li>
          <li>
            <strong>functionality_storage:</strong> Always granted (required for app to work)
          </li>
          <li>
            <strong>personalization_storage:</strong> Always granted (theme, language preferences)
          </li>
          <li>
            <strong>security_storage:</strong> Always granted (payment security cookies)
          </li>
        </ul>
        <p className='mt-4'>
          This approach ensures full GDPR compliance while allowing Google to improve its services through
          privacy-preserving techniques when permitted.
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>6. Data Security</h2>
        <p>
          Sensitive data stored in your browser (such as your premium activation key) is encrypted using industry-standard
          methods before being saved. However, please note:
        </p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>Local storage is specific to your browser and device</li>
          <li>Data is not synchronized across devices or browsers</li>
          <li>Clearing your browser data will remove all stored information</li>
          <li>We do not have access to data stored in your browser&apos;s local storage</li>
        </ul>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>7. Third-Party Cookies</h2>
        <p>
          Forever PTO may use third-party services that set their own cookies. These services are limited to:
        </p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>
            <strong>Payment Processors:</strong> When you activate premium features, payment service providers may set
            cookies necessary to process your transaction securely
          </li>
          <li>
            <strong>Holiday APIs:</strong> Third-party holiday data providers may use cookies when fetching holiday
            information
          </li>
        </ul>
        <p className='mt-4'>
          We do not control these third-party cookies. Please refer to the respective third-party privacy policies for
          more information.
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>8. Managing and Deleting Cookies</h2>
        <p>You have several options to manage or delete cookies and local storage:</p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>8.1 Browser Settings</h3>
        <p>Most browsers allow you to:</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>View and delete cookies and local storage</li>
          <li>Block all cookies or local storage</li>
          <li>Block cookies from specific websites</li>
          <li>Delete all cookies when you close your browser</li>
        </ul>
        <p className='mt-4'>
          Please note that blocking or deleting cookies and local storage will prevent Forever PTO from functioning
          properly, as all your settings and data will be lost.
        </p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>8.2 Browser-Specific Instructions</h3>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>
            <strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data
          </li>
          <li>
            <strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data
          </li>
          <li>
            <strong>Safari:</strong> Preferences → Privacy → Manage Website Data
          </li>
          <li>
            <strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data
          </li>
        </ul>

        <h3 className='text-xl font-semibold mt-6 mb-3'>8.3 In-App Data Management</h3>
        <p>
          Forever PTO provides in-app controls to clear your data. You can reset your application settings, which will
          clear all stored information from your browser&apos;s local storage.
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>9. Your Rights</h2>
        <p>Under GDPR and other data protection regulations, you have the right to:</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>Know what data is being stored in your browser</li>
          <li>Access your stored data (by inspecting browser local storage)</li>
          <li>Delete your data at any time (by clearing browser storage)</li>
          <li>Withdraw consent for optional cookies</li>
          <li>Object to data processing (by not using the service or clearing storage)</li>
        </ul>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>10. Changes to This Cookie Policy</h2>
        <p>
          We may update this Cookie Policy from time to time to reflect changes in our practices or for legal,
          regulatory, or operational reasons. When we make changes, we will update the &quot;Last Updated&quot; date at the
          top of this policy.
        </p>
        <p className='mt-4'>
          We encourage you to review this Cookie Policy periodically to stay informed about how we use cookies and
          local storage.
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>11. Contact Us</h2>
        <p>
          If you have any questions about this Cookie Policy or our use of cookies and local storage, please contact
          us:
        </p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>
            <strong>Email:</strong> [YOUR_EMAIL]
          </li>
          <li>
            <strong>Website:</strong> https://forever-pto.com
          </li>
        </ul>
      </section>
    </LegalLayout>
  );
}
