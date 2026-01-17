import { LegalLayout } from '@ui/modules/components/legal/LegalLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Legal Notice | Forever PTO',
  description: 'Legal notice and information about Forever PTO',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LegalNoticePage() {
  return (
    <LegalLayout title='Legal Notice' lastUpdated='January 17, 2025'>
      <section>
        <h2 className='text-2xl font-semibold mt-6 mb-4'>1. Identification Data</h2>
        <p>
          In compliance with Article 10 of Law 34/2002, of July 11, on Information Society Services and Electronic
          Commerce (LSSI), the following information is provided:
        </p>
        <ul className='list-disc pl-6 mt-4 space-y-2'>
          <li>
            <strong>Owner:</strong> [YOUR_FULL_NAME or COMPANY_NAME]
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
        <h2 className='text-2xl font-semibold mt-8 mb-4'>2. Purpose</h2>
        <p>
          Forever PTO is a web application that allows users to calculate and optimize their PTO (Paid Time Off) days
          by strategically combining them with national, regional, and custom holidays.
        </p>
        <p className='mt-4'>The application offers:</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>
            <strong>Free Version:</strong> Basic PTO suggestion calculations, holiday visualization, and limited
            customization
          </li>
          <li>
            <strong>Premium Version:</strong> Advanced features including detailed metrics, distribution charts,
            efficiency analysis, multiple optimization strategies, and planning alternatives
          </li>
        </ul>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>3. Access and Use Conditions</h2>
        <p>
          Accessing and using Forever PTO grants the User status and implies full and unreserved acceptance of all
          provisions included in this Legal Notice.
        </p>
        <p className='mt-4'>The User agrees to:</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>Use the application correctly in accordance with current legislation</li>
          <li>Not engage in illegal activities or activities contrary to good faith and public order</li>
          <li>Not introduce or distribute computer viruses or any other malicious code</li>
          <li>Not access restricted areas of computer systems without authorization</li>
          <li>Not share their premium activation key with third parties (the key is personal and non-transferable)</li>
        </ul>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>4. Liability</h2>
        <p>Forever PTO is not responsible for:</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>
            The absolute accuracy of displayed holidays, which are obtained from public sources and may contain errors
            or be outdated
          </li>
          <li>
            Employment or personal decisions made based solely on the application&apos;s suggestions
          </li>
          <li>Service interruptions due to technical, maintenance, or third-party causes</li>
          <li>Damages or losses resulting from misuse of the application by users</li>
          <li>Third-party content linked from the application (holiday APIs, payment processors, etc.)</li>
        </ul>
        <p className='mt-4'>
          The calculations and suggestions provided are for guidance only. Users should always verify official holidays
          applicable to their company and current local legislation before making decisions about their PTO days.
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>5. Intellectual and Industrial Property</h2>
        <p>
          All website content, including but not limited to texts, designs, graphics, source code, logos, icons, images,
          audio and video files, downloads, and data compilations, are property of [YOUR_NAME] or their legitimate
          owners and are protected by Spanish and international intellectual and industrial property laws.
        </p>
        <p className='mt-4'>
          Reproduction, distribution, public communication, transformation, or any other activity with the content is
          prohibited without express written authorization from the holder of the corresponding exploitation rights.
        </p>
        <p className='mt-4'>
          Forever PTO&apos;s source code is available under an open-source license on{' '}
          <a
            href='https://github.com/[YOUR_REPO]'
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary hover:underline'
          >
            GitHub
          </a>
          . Check the LICENSE file for more details on code use and distribution terms.
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>6. Third-Party Links</h2>
        <p>
          Forever PTO may contain links to third-party websites (payment processors, holiday APIs, analytics services,
          etc.). Forever PTO does not control and is not responsible for the content, privacy policies, or practices of
          these third-party sites.
        </p>
        <p className='mt-4'>
          Users are advised to read the privacy policies and terms of use of any third-party websites they visit.
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>7. Modifications</h2>
        <p>
          Forever PTO reserves the right to modify this Legal Notice at any time. Changes will take effect from their
          publication on the website.
        </p>
        <p className='mt-4'>
          It is the User&apos;s responsibility to periodically review this Legal Notice to stay informed of possible
          changes. Continued use of the website after publication of changes constitutes acceptance of such changes.
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>8. Applicable Law and Jurisdiction</h2>
        <p>
          These conditions are governed by Spanish law. For resolution of any dispute that may arise between the User
          and Forever PTO, the parties expressly submit to the Courts and Tribunals of [YOUR_CITY], waiving any other
          jurisdiction that may correspond to them.
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>9. Contact</h2>
        <p>
          For any questions, suggestions, or inquiries related to this Legal Notice, you may contact us through:
        </p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>
            <strong>Email:</strong> [YOUR_EMAIL]
          </li>
        </ul>
      </section>
    </LegalLayout>
  );
}
