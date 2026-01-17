import { LegalLayout } from '@ui/modules/components/legal/LegalLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Forever PTO',
  description: 'Privacy policy and data protection information for Forever PTO',
  robots: {
    index: false,
    follow: false,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout title='Privacy Policy' lastUpdated='January 17, 2025'>
      <section>
        <h2 className='text-2xl font-semibold mt-6 mb-4'>1. Introduction</h2>
        <p>
          At Forever PTO, we are committed to protecting your privacy and personal data. This Privacy Policy explains
          how we collect, use, store, and protect your information when you use our web application.
        </p>
        <p className='mt-4'>
          Forever PTO is designed with privacy in mind. All your data is stored locally in your browser, and we do not
          collect or store personal information on our servers unless explicitly stated in this policy.
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>2. Data Controller</h2>
        <p>The data controller responsible for your personal data is:</p>
        <ul className='list-disc pl-6 mt-4 space-y-2'>
          <li>
            <strong>Name:</strong> [YOUR_FULL_NAME or COMPANY_NAME]
          </li>
          <li>
            <strong>Tax ID:</strong> [YOUR_TAX_ID]
          </li>
          <li>
            <strong>Address:</strong> [YOUR_COMPLETE_ADDRESS]
          </li>
          <li>
            <strong>Email:</strong> [YOUR_EMAIL]
          </li>
          <li>
            <strong>Website:</strong> https://forever-pto.com
          </li>
        </ul>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>3. Data We Collect and How We Use It</h2>

        <h3 className='text-xl font-semibold mt-6 mb-3'>3.1 Data Stored Locally in Your Browser</h3>
        <p>
          Forever PTO stores all application data locally in your browser using local storage. This data never leaves
          your device unless you explicitly interact with external services (like payment processors). The data stored
          includes:
        </p>
        <ul className='list-disc pl-6 mt-4 space-y-3'>
          <li>
            <strong>Application Settings:</strong> Your PTO days, selected country, region, year, optimization
            strategy, and other configuration preferences
          </li>
          <li>
            <strong>Holiday Data:</strong> Cached information about national and regional holidays for your selected
            location
          </li>
          <li>
            <strong>Custom Holidays:</strong> Any custom holidays you manually add to your calendar
          </li>
          <li>
            <strong>Calendar State:</strong> Your manual PTO day selections, removed suggestions, and calendar
            modifications
          </li>
          <li>
            <strong>Premium Activation Key:</strong> If you activate premium features, your activation key is stored
            encrypted in local storage
          </li>
          <li>
            <strong>Theme Preferences:</strong> Your dark/light mode selection
          </li>
          <li>
            <strong>Cookie Consent:</strong> Your cookie banner preferences
          </li>
        </ul>
        <p className='mt-4'>
          <strong>Legal Basis:</strong> Legitimate interest (necessary for the application to function) and consent
          (for optional features).
        </p>
        <p className='mt-2'>
          <strong>Data Retention:</strong> This data persists in your browser until you clear it manually or uninstall
          the application.
        </p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>3.2 Payment Information</h3>
        <p>
          When you purchase premium features, payment processing is handled by third-party payment processors. We do
          not store your credit card information or payment details on our servers.
        </p>
        <p className='mt-4'>Information collected during payment includes:</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>Transaction ID and payment confirmation</li>
          <li>Premium activation key generated for your purchase</li>
          <li>Email address (if provided) for sending the activation key</li>
        </ul>
        <p className='mt-4'>
          <strong>Legal Basis:</strong> Contract performance (necessary to provide premium features you purchased).
        </p>
        <p className='mt-2'>
          <strong>Data Retention:</strong> Payment records are retained for the minimum period required by tax and
          accounting regulations (typically 6-10 years depending on jurisdiction).
        </p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>3.3 Analytics and Usage Data (Optional)</h3>
        <p>
          If you consent via our cookie banner, we may collect anonymized usage statistics to understand how users
          interact with Forever PTO and improve the user experience. This includes:
        </p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>Pages visited and features used</li>
          <li>Browser type and device information</li>
          <li>General geographic location (country/region level, not precise location)</li>
          <li>Interaction patterns and feature usage frequency</li>
        </ul>
        <p className='mt-4'>
          <strong>Legal Basis:</strong> Consent (you can withdraw consent at any time).
        </p>
        <p className='mt-2'>
          <strong>Data Retention:</strong> Analytics data is typically retained for 14-26 months depending on the
          service used.
        </p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>3.4 Contact and Support</h3>
        <p>
          If you contact us for support or inquiries, we collect the information you provide in your message (email
          address, name if provided, and message content) solely to respond to your request.
        </p>
        <p className='mt-4'>
          <strong>Legal Basis:</strong> Legitimate interest (responding to your inquiry).
        </p>
        <p className='mt-2'>
          <strong>Data Retention:</strong> Support correspondence is retained for up to 3 years for quality assurance
          and legal compliance.
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>4. Cookies and Tracking Technologies</h2>
        <p>
          Forever PTO uses cookies and browser local storage to provide functionality and, with your consent, to
          analyze usage patterns. For detailed information about the cookies we use, how we use them, and how to
          manage your cookie preferences, please see our{' '}
          <a href='/legal/cookie-policy' className='text-primary hover:underline'>
            Cookie Policy
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>5. Data Sharing and Third Parties</h2>
        <p>
          We do not sell, rent, or trade your personal information to third parties. We only share data with trusted
          service providers in the following limited circumstances:
        </p>
        <ul className='list-disc pl-6 mt-4 space-y-3'>
          <li>
            <strong>Payment Processors:</strong> When you purchase premium features, your payment information is
            processed by third-party payment service providers (e.g., Stripe, PayPal). These services have their own
            privacy policies.
          </li>
          <li>
            <strong>Holiday Data Providers:</strong> We fetch holiday information from public APIs. Your selected
            country and region may be sent to these services to retrieve relevant data.
          </li>
          <li>
            <strong>Analytics Services:</strong> If you consent, anonymized usage data may be shared with analytics
            providers to help us improve the application.
          </li>
          <li>
            <strong>Legal Requirements:</strong> We may disclose information if required by law, legal process, or to
            protect our rights or the rights of others.
          </li>
        </ul>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>6. Data Security</h2>
        <p>We implement appropriate technical and organizational measures to protect your data:</p>
        <ul className='list-disc pl-6 mt-4 space-y-3'>
          <li>
            <strong>Encryption:</strong> Sensitive data stored in browser local storage (like premium activation keys)
            is encrypted using industry-standard methods
          </li>
          <li>
            <strong>Local Storage:</strong> Most data never leaves your device, reducing exposure to network-based
            attacks
          </li>
          <li>
            <strong>HTTPS:</strong> All communications between your browser and our servers are encrypted using SSL/TLS
          </li>
          <li>
            <strong>Minimal Data Collection:</strong> We only collect data that is necessary for functionality
          </li>
        </ul>
        <p className='mt-4'>
          However, no method of transmission over the internet or electronic storage is 100% secure. While we strive
          to protect your data, we cannot guarantee absolute security.
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>7. Your Rights Under GDPR and Data Protection Laws</h2>
        <p>If you are in the European Union or European Economic Area, you have the following rights:</p>
        <ul className='list-disc pl-6 mt-4 space-y-3'>
          <li>
            <strong>Right of Access:</strong> You can request access to your personal data. Since most data is stored
            locally, you can view it directly in your browser&apos;s developer tools.
          </li>
          <li>
            <strong>Right to Rectification:</strong> You can correct inaccurate data directly in the application
            settings.
          </li>
          <li>
            <strong>Right to Erasure:</strong> You can delete your data at any time by clearing your browser&apos;s
            local storage or using the in-app reset function.
          </li>
          <li>
            <strong>Right to Restrict Processing:</strong> You can limit how we process your data by adjusting cookie
            preferences and not using optional features.
          </li>
          <li>
            <strong>Right to Data Portability:</strong> You can export your application settings and data for use
            elsewhere.
          </li>
          <li>
            <strong>Right to Object:</strong> You can object to data processing by not using the service or specific
            features.
          </li>
          <li>
            <strong>Right to Withdraw Consent:</strong> You can withdraw consent for analytics cookies at any time via
            the cookie banner or browser settings.
          </li>
          <li>
            <strong>Right to Lodge a Complaint:</strong> You can file a complaint with your national data protection
            authority if you believe we have violated data protection laws.
          </li>
        </ul>
        <p className='mt-4'>
          To exercise these rights or if you have questions, please contact us at [YOUR_EMAIL].
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>8. International Data Transfers</h2>
        <p>
          Forever PTO is hosted on servers that may be located in different countries. When you use our service, your
          data may be transferred to and processed in countries outside your country of residence.
        </p>
        <p className='mt-4'>
          For EU users: If data is transferred outside the European Economic Area, we ensure appropriate safeguards
          are in place (such as Standard Contractual Clauses or adequacy decisions) to protect your data in accordance
          with GDPR requirements.
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>9. Children&apos;s Privacy</h2>
        <p>
          Forever PTO is not intended for children under 16 years of age. We do not knowingly collect personal
          information from children under 16. If we become aware that we have collected personal data from a child
          under 16 without parental consent, we will take steps to delete that information.
        </p>
        <p className='mt-4'>
          If you are a parent or guardian and believe your child has provided us with personal information, please
          contact us at [YOUR_EMAIL].
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>10. Changes to This Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal
          requirements, or other factors. When we make changes, we will update the &quot;Last Updated&quot; date at the top of
          this policy.
        </p>
        <p className='mt-4'>
          For material changes that significantly affect your rights, we will provide notice through the application or
          via email (if we have your email address).
        </p>
        <p className='mt-4'>
          We encourage you to review this Privacy Policy periodically to stay informed about how we protect your
          information.
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>11. Data Breach Notification</h2>
        <p>
          In the unlikely event of a data breach that affects your personal information, we will notify you and
          relevant authorities as required by applicable data protection laws, typically within 72 hours of becoming
          aware of the breach.
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>12. Contact Information</h2>
        <p>
          If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your personal
          data, please contact us:
        </p>
        <ul className='list-disc pl-6 mt-4 space-y-2'>
          <li>
            <strong>Email:</strong> [YOUR_EMAIL]
          </li>
          <li>
            <strong>Website:</strong> https://forever-pto.com
          </li>
          <li>
            <strong>Postal Address:</strong> [YOUR_COMPLETE_ADDRESS]
          </li>
        </ul>
        <p className='mt-4'>
          We will respond to your inquiries within 30 days as required by GDPR and other applicable data protection
          regulations.
        </p>
      </section>
    </LegalLayout>
  );
}
