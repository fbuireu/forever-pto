import { LegalLayout } from '@ui/modules/components/legal/LegalLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Forever PTO',
  description: 'Terms and conditions for using Forever PTO',
  robots: {
    index: false,
    follow: false,
  },
};

export default function TermsOfServicePage() {
  return (
    <LegalLayout title='Terms of Service' lastUpdated='January 17, 2025'>
      <section>
        <h2 className='text-2xl font-semibold mt-6 mb-4'>1. Acceptance of Terms</h2>
        <p>
          By accessing or using Forever PTO (&quot;the Service&quot;), you agree to be bound by these Terms of Service
          (&quot;Terms&quot;). If you do not agree to these Terms, you may not use the Service.
        </p>
        <p className='mt-4'>
          These Terms apply to all users of Forever PTO, whether you use the free version or have activated premium
          features.
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>2. Service Description</h2>
        <p>
          Forever PTO is a web application that helps users optimize their Paid Time Off (PTO) days by strategically
          combining them with national, regional, and custom holidays to maximize consecutive days off.
        </p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>2.1 Free Version</h3>
        <p>The free version includes:</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>Basic PTO optimization suggestions</li>
          <li>Holiday visualization for your country and region</li>
          <li>Custom holiday management</li>
          <li>Limited metrics and analysis</li>
          <li>Single optimization strategy</li>
        </ul>

        <h3 className='text-xl font-semibold mt-6 mb-3'>2.2 Premium Version</h3>
        <p>Premium features include:</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>Advanced metrics and detailed analytics</li>
          <li>Distribution charts (quarterly, monthly, holiday composition)</li>
          <li>Efficiency analysis and year summary</li>
          <li>Multiple optimization strategies</li>
          <li>Alternative planning options</li>
          <li>Long weekend and bridge analysis</li>
          <li>Unlimited customization capabilities</li>
        </ul>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>3. User Accounts and Eligibility</h2>
        <p>
          Forever PTO does not require user accounts for basic functionality. All data is stored locally in your
          browser.
        </p>
        <p className='mt-4'>To use this Service, you must:</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>Be at least 16 years of age</li>
          <li>Have the legal capacity to enter into binding agreements</li>
          <li>Comply with all applicable laws and regulations</li>
          <li>Use the Service only for lawful purposes</li>
        </ul>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>4. Premium Features and Payments</h2>

        <h3 className='text-xl font-semibold mt-6 mb-3'>4.1 Premium Activation</h3>
        <p>
          Premium features are activated through a one-time payment. After successful payment, you will receive a
          premium activation key that unlocks all premium features.
        </p>
        <p className='mt-4'>Premium activation characteristics:</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>One-time payment (not a subscription)</li>
          <li>Lifetime access to current premium features</li>
          <li>Personal and non-transferable activation key</li>
          <li>Valid for use on multiple devices with the same activation key</li>
        </ul>

        <h3 className='text-xl font-semibold mt-6 mb-3'>4.2 Pricing</h3>
        <p>
          Current pricing for premium features is displayed on the application at the time of purchase. We reserve the
          right to change pricing at any time, but changes will not affect keys already purchased.
        </p>
        <p className='mt-4'>All prices include applicable taxes unless otherwise stated.</p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>4.3 Payment Processing</h3>
        <p>Payments are processed by trusted third-party payment processors such as:</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>Stripe</li>
          <li>PayPal</li>
          <li>Other authorized payment providers</li>
        </ul>
        <p className='mt-4'>
          We do not store your credit card or payment information. Payment processors have their own terms and privacy
          policies.
        </p>
        <p className='mt-4'>By making a payment, you authorize us to charge your chosen payment method.</p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>4.4 Premium Key Security</h3>
        <p>
          Your premium activation key is personal and confidential. You are responsible for keeping it secure. Do not
          share your activation key with third parties.
        </p>
        <p className='mt-4'>
          We reserve the right to deactivate keys that are shared publicly, resold, or used in violation of these
          Terms.
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>5. Refund Policy</h2>

        <h3 className='text-xl font-semibold mt-6 mb-3'>5.1 Refund Eligibility</h3>
        <p>
          We offer refunds within <strong>14 days</strong> of purchase under the following conditions:
        </p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>Technical issues prevent you from using premium features</li>
          <li>The premium features do not work as described</li>
          <li>You accidentally purchased the wrong product or made a duplicate purchase</li>
          <li>You are not satisfied with the premium features (no questions asked)</li>
        </ul>

        <h3 className='text-xl font-semibold mt-6 mb-3'>5.2 Refund Exclusions</h3>
        <p>Refunds will not be granted if:</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>More than 14 days have passed since purchase</li>
          <li>You have violated these Terms of Service</li>
          <li>You have shared or resold your activation key</li>
          <li>The refund request is fraudulent or abusive</li>
        </ul>

        <h3 className='text-xl font-semibold mt-6 mb-3'>5.3 Refund Process</h3>
        <p>To request a refund:</p>
        <ol className='list-decimal pl-6 mt-2 space-y-2'>
          <li>Contact us at [YOUR_EMAIL] within 14 days of purchase</li>
          <li>Include your transaction ID and reason for the refund request</li>
          <li>
            We will review your request and respond within 5 business days
          </li>
          <li>If approved, refunds are processed within 7-10 business days to your original payment method</li>
        </ol>

        <h3 className='text-xl font-semibold mt-6 mb-3'>5.4 Post-Refund Access</h3>
        <p>
          After a refund is processed, your premium activation key will be deactivated, and you will lose access to
          premium features. You may continue using the free version of Forever PTO.
        </p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>5.5 EU Consumer Rights</h3>
        <p>
          For users in the European Union: You have the right to withdraw from the purchase within 14 days without
          giving any reason, in accordance with EU Directive 2011/83/EU on consumer rights.
        </p>
        <p className='mt-4'>
          However, if you request immediate access to premium features before the 14-day withdrawal period expires, you
          acknowledge that you are waiving your right of withdrawal once you activate your premium key and start using
          premium features.
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>6. User Responsibilities</h2>
        <p>When using Forever PTO, you agree to:</p>
        <ul className='list-disc pl-6 mt-4 space-y-2'>
          <li>Use the Service in accordance with all applicable laws and regulations</li>
          <li>Not engage in any activity that could harm, disable, or impair the Service</li>
          <li>Not attempt to gain unauthorized access to any part of the Service</li>
          <li>Not use automated systems (bots, scrapers) to access the Service without permission</li>
          <li>Not reverse engineer, decompile, or disassemble any part of the Service</li>
          <li>
            Not share, resell, or distribute your premium activation key to unauthorized third parties
          </li>
          <li>Verify holiday information with official sources before making employment decisions</li>
          <li>Not use the Service for any illegal or unauthorized purpose</li>
        </ul>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>7. Disclaimer of Warranties</h2>
        <p>
          Forever PTO is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or
          implied, including but not limited to:
        </p>
        <ul className='list-disc pl-6 mt-4 space-y-3'>
          <li>
            <strong>Accuracy of Information:</strong> We do not guarantee the absolute accuracy of holiday data,
            calculations, or suggestions provided by the Service. Holiday information is sourced from public APIs and
            may contain errors or be outdated.
          </li>
          <li>
            <strong>Service Availability:</strong> We do not guarantee that the Service will be available at all times,
            uninterrupted, secure, or error-free.
          </li>
          <li>
            <strong>Fitness for Purpose:</strong> We do not warrant that the Service will meet your specific
            requirements or expectations.
          </li>
          <li>
            <strong>Data Integrity:</strong> Since data is stored locally in your browser, we cannot guarantee data
            persistence if you clear browser storage or switch devices.
          </li>
        </ul>
        <p className='mt-4'>
          You acknowledge that any decisions you make based on the Service&apos;s suggestions are your sole
          responsibility. Always verify holiday information with official sources and your employer before requesting
          time off.
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>8. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by applicable law, Forever PTO and its owners, employees, or affiliates shall
          not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not
          limited to:
        </p>
        <ul className='list-disc pl-6 mt-4 space-y-2'>
          <li>Loss of profits, revenue, or business opportunities</li>
          <li>Loss of data or information</li>
          <li>Employment consequences from incorrect holiday information</li>
          <li>Service interruptions or unavailability</li>
          <li>Unauthorized access to or use of our servers or your personal information</li>
        </ul>
        <p className='mt-4'>
          In any event, our total liability for all claims related to the Service shall not exceed the amount you paid
          for premium features (if applicable) in the 12 months preceding the claim.
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>9. Intellectual Property</h2>
        <p>
          All content, features, and functionality of Forever PTO, including but not limited to text, graphics, logos,
          icons, images, source code, and algorithms, are owned by [YOUR_NAME] or licensed to us and are protected by
          international copyright, trademark, and other intellectual property laws.
        </p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>9.1 Limited License</h3>
        <p>
          We grant you a limited, non-exclusive, non-transferable, revocable license to access and use Forever PTO for
          personal, non-commercial purposes in accordance with these Terms.
        </p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>9.2 Open Source</h3>
        <p>
          Forever PTO&apos;s source code is available under an open-source license on{' '}
          <a
            href='https://github.com/[YOUR_REPO]'
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary hover:underline'
          >
            GitHub
          </a>
          . The source code license is separate from these Terms and governs the use, modification, and distribution of
          the code. Please refer to the LICENSE file in the repository for details.
        </p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>9.3 Restrictions</h3>
        <p>You may not:</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>Copy, modify, or distribute the Service (except as allowed by the open-source license for code)</li>
          <li>Create derivative works based on the Service without permission</li>
          <li>Remove or alter any copyright, trademark, or proprietary notices</li>
          <li>Use our trademarks, logos, or branding without written permission</li>
        </ul>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>10. Third-Party Services and Links</h2>
        <p>Forever PTO integrates with or links to third-party services, including:</p>
        <ul className='list-disc pl-6 mt-4 space-y-2'>
          <li>Payment processors (Stripe, PayPal, etc.)</li>
          <li>Holiday data APIs</li>
          <li>Analytics services</li>
          <li>External websites and resources</li>
        </ul>
        <p className='mt-4'>
          We are not responsible for the content, privacy policies, or practices of these third-party services. Your
          use of third-party services is subject to their own terms and policies.
        </p>
        <p className='mt-4'>
          We do not endorse or make any representations about third-party services. You access them at your own risk.
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>11. Service Modifications and Termination</h2>

        <h3 className='text-xl font-semibold mt-6 mb-3'>11.1 Modifications</h3>
        <p>We reserve the right to:</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>Modify, suspend, or discontinue any aspect of the Service at any time</li>
          <li>Change features available in free or premium versions</li>
          <li>Update pricing for future purchases (without affecting existing premium users)</li>
          <li>Impose usage limits or restrictions</li>
        </ul>
        <p className='mt-4'>
          We will make reasonable efforts to notify users of significant changes, but we are not obligated to do so.
        </p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>11.2 Termination by Us</h3>
        <p>We may terminate or suspend your access to Forever PTO immediately, without notice, if:</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>You violate these Terms of Service</li>
          <li>You engage in fraudulent or abusive behavior</li>
          <li>You share or resell your premium activation key</li>
          <li>We are required to do so by law</li>
          <li>We decide to discontinue the Service</li>
        </ul>

        <h3 className='text-xl font-semibold mt-6 mb-3'>11.3 Termination by You</h3>
        <p>
          You may stop using Forever PTO at any time by clearing your browser data. If you have purchased premium
          features, termination does not entitle you to a refund unless you meet the conditions in our Refund Policy.
        </p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>11.4 Effect of Termination</h3>
        <p>Upon termination:</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>Your right to use the Service ceases immediately</li>
          <li>Your premium activation key (if any) will be deactivated</li>
          <li>Data stored in your browser remains unless you manually delete it</li>
          <li>Provisions of these Terms that should survive termination will continue to apply</li>
        </ul>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>12. Indemnification</h2>
        <p>
          You agree to indemnify, defend, and hold harmless Forever PTO, its owners, employees, contractors, and
          affiliates from any claims, liabilities, damages, losses, costs, or expenses (including reasonable
          attorneys&apos; fees) arising from:
        </p>
        <ul className='list-disc pl-6 mt-4 space-y-2'>
          <li>Your use or misuse of the Service</li>
          <li>Your violation of these Terms</li>
          <li>Your violation of any rights of third parties</li>
          <li>Your violation of applicable laws or regulations</li>
        </ul>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>13. Governing Law and Dispute Resolution</h2>

        <h3 className='text-xl font-semibold mt-6 mb-3'>13.1 Governing Law</h3>
        <p>
          These Terms are governed by and construed in accordance with the laws of Spain, without regard to conflict of
          law principles.
        </p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>13.2 Jurisdiction</h3>
        <p>
          Any disputes arising from these Terms or your use of Forever PTO shall be subject to the exclusive
          jurisdiction of the courts of [YOUR_CITY], Spain.
        </p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>13.3 Dispute Resolution</h3>
        <p>
          Before filing any legal claim, you agree to first contact us at [YOUR_EMAIL] to attempt to resolve the
          dispute informally. We will make good-faith efforts to resolve disputes amicably.
        </p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>13.4 EU Online Dispute Resolution</h3>
        <p>
          For EU consumers: The European Commission provides an online dispute resolution platform accessible at{' '}
          <a
            href='https://ec.europa.eu/consumers/odr'
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary hover:underline'
          >
            https://ec.europa.eu/consumers/odr
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>14. Severability</h2>
        <p>
          If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions
          will continue in full force and effect. The invalid provision will be modified to the minimum extent necessary
          to make it valid and enforceable.
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>15. Entire Agreement</h2>
        <p>
          These Terms, together with our Privacy Policy, constitute the entire agreement between you and Forever PTO
          regarding the Service and supersede all prior agreements and understandings.
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>16. Waiver</h2>
        <p>
          Our failure to enforce any right or provision of these Terms will not constitute a waiver of that right or
          provision. Any waiver must be in writing and signed by us.
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>17. Changes to These Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. When we make changes, we will update the &quot;Last
          Updated&quot; date at the top of this page and notify users through the application or via email (if available).
        </p>
        <p className='mt-4'>
          Your continued use of Forever PTO after changes are posted constitutes your acceptance of the modified Terms.
          If you do not agree to the changes, you must stop using the Service.
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>18. Contact Information</h2>
        <p>
          If you have any questions, concerns, or feedback about these Terms of Service, please contact us:
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
        <p className='mt-4'>We will respond to your inquiries as soon as possible, typically within 5 business days.</p>
      </section>
    </LegalLayout>
  );
}
