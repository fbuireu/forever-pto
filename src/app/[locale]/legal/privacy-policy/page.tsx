import { LegalLayout } from '@ui/modules/components/legal/LegalLayout';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'Privacy Policy | Forever PTO',
  description: 'Privacy policy and data protection information for Forever PTO',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PrivacyPolicyPage() {
  const t = await getTranslations('legalPages.privacyPolicy');

  return (
    <LegalLayout title={t('title')} lastUpdated={t('lastUpdated')}>
      <section>
        <h2 className='text-2xl font-semibold mt-6 mb-4'>{t('sections.introduction.title')}</h2>
        <p>{t('sections.introduction.p1')}</p>
        <p className='mt-4'>{t('sections.introduction.p2')}</p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.dataController.title')}</h2>
        <p>{t('sections.dataController.description')}</p>
        <ul className='list-disc pl-6 mt-4 space-y-2'>
          <li>
            <strong>{t('sections.dataController.items.name.label')}</strong> {t('sections.dataController.items.name.value')}
          </li>
          <li>
            <strong>{t('sections.dataController.items.taxId.label')}</strong> {t('sections.dataController.items.taxId.value')}
          </li>
          <li>
            <strong>{t('sections.dataController.items.address.label')}</strong> {t('sections.dataController.items.address.value')}
          </li>
          <li>
            <strong>{t('sections.dataController.items.email.label')}</strong> {t('sections.dataController.items.email.value')}
          </li>
          <li>
            <strong>{t('sections.dataController.items.website.label')}</strong> https://forever-pto.com
          </li>
        </ul>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.dataWeCollect.title')}</h2>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.dataWeCollect.localStorage.title')}</h3>
        <p>{t('sections.dataWeCollect.localStorage.description')}</p>
        <ul className='list-disc pl-6 mt-4 space-y-3'>
          <li>
            <strong>{t('sections.dataWeCollect.localStorage.items.settings.label')}</strong>{' '}
            {t('sections.dataWeCollect.localStorage.items.settings.description')}
          </li>
          <li>
            <strong>{t('sections.dataWeCollect.localStorage.items.holidayData.label')}</strong>{' '}
            {t('sections.dataWeCollect.localStorage.items.holidayData.description')}
          </li>
          <li>
            <strong>{t('sections.dataWeCollect.localStorage.items.customHolidays.label')}</strong>{' '}
            {t('sections.dataWeCollect.localStorage.items.customHolidays.description')}
          </li>
          <li>
            <strong>{t('sections.dataWeCollect.localStorage.items.calendarState.label')}</strong>{' '}
            {t('sections.dataWeCollect.localStorage.items.calendarState.description')}
          </li>
          <li>
            <strong>{t('sections.dataWeCollect.localStorage.items.premiumKey.label')}</strong>{' '}
            {t('sections.dataWeCollect.localStorage.items.premiumKey.description')}
          </li>
          <li>
            <strong>{t('sections.dataWeCollect.localStorage.items.theme.label')}</strong>{' '}
            {t('sections.dataWeCollect.localStorage.items.theme.description')}
          </li>
          <li>
            <strong>{t('sections.dataWeCollect.localStorage.items.cookieConsent.label')}</strong>{' '}
            {t('sections.dataWeCollect.localStorage.items.cookieConsent.description')}
          </li>
        </ul>
        <p className='mt-4'>
          <strong>{t('sections.dataWeCollect.localStorage.legalBasis.label')}</strong>{' '}
          {t('sections.dataWeCollect.localStorage.legalBasis.description')}
        </p>
        <p className='mt-2'>
          <strong>{t('sections.dataWeCollect.localStorage.retention.label')}</strong>{' '}
          {t('sections.dataWeCollect.localStorage.retention.description')}
        </p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.dataWeCollect.payment.title')}</h3>
        <p>{t('sections.dataWeCollect.payment.description')}</p>
        <p className='mt-4'>{t('sections.dataWeCollect.payment.collectedInfo')}</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>{t('sections.dataWeCollect.payment.items.transactionId')}</li>
          <li>{t('sections.dataWeCollect.payment.items.activationKey')}</li>
          <li>{t('sections.dataWeCollect.payment.items.email')}</li>
        </ul>
        <p className='mt-4'>
          <strong>{t('sections.dataWeCollect.payment.legalBasis.label')}</strong>{' '}
          {t('sections.dataWeCollect.payment.legalBasis.description')}
        </p>
        <p className='mt-2'>
          <strong>{t('sections.dataWeCollect.payment.retention.label')}</strong>{' '}
          {t('sections.dataWeCollect.payment.retention.description')}
        </p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.dataWeCollect.analytics.title')}</h3>
        <p>{t('sections.dataWeCollect.analytics.description')}</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>{t('sections.dataWeCollect.analytics.items.pagesVisited')}</li>
          <li>{t('sections.dataWeCollect.analytics.items.browserInfo')}</li>
          <li>{t('sections.dataWeCollect.analytics.items.location')}</li>
          <li>{t('sections.dataWeCollect.analytics.items.interactions')}</li>
        </ul>
        <p className='mt-4'>
          <strong>{t('sections.dataWeCollect.analytics.legalBasis.label')}</strong>{' '}
          {t('sections.dataWeCollect.analytics.legalBasis.description')}
        </p>
        <p className='mt-2'>
          <strong>{t('sections.dataWeCollect.analytics.retention.label')}</strong>{' '}
          {t('sections.dataWeCollect.analytics.retention.description')}
        </p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.dataWeCollect.contact.title')}</h3>
        <p>{t('sections.dataWeCollect.contact.description')}</p>
        <p className='mt-4'>
          <strong>{t('sections.dataWeCollect.contact.legalBasis.label')}</strong>{' '}
          {t('sections.dataWeCollect.contact.legalBasis.description')}
        </p>
        <p className='mt-2'>
          <strong>{t('sections.dataWeCollect.contact.retention.label')}</strong>{' '}
          {t('sections.dataWeCollect.contact.retention.description')}
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.cookiesAndTracking.title')}</h2>
        <p>
          {t.rich('sections.cookiesAndTracking.description', {
            link: (chunks) => (
              <a href='/legal/cookie-policy' className='text-primary hover:underline'>
                {chunks}
              </a>
            ),
          })}
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.dataSharing.title')}</h2>
        <p>{t('sections.dataSharing.description')}</p>
        <ul className='list-disc pl-6 mt-4 space-y-3'>
          <li>
            <strong>{t('sections.dataSharing.items.paymentProcessors.label')}</strong>{' '}
            {t('sections.dataSharing.items.paymentProcessors.description')}
          </li>
          <li>
            <strong>{t('sections.dataSharing.items.holidayProviders.label')}</strong>{' '}
            {t('sections.dataSharing.items.holidayProviders.description')}
          </li>
          <li>
            <strong>{t('sections.dataSharing.items.analytics.label')}</strong>{' '}
            {t('sections.dataSharing.items.analytics.description')}
          </li>
          <li>
            <strong>{t('sections.dataSharing.items.legal.label')}</strong>{' '}
            {t('sections.dataSharing.items.legal.description')}
          </li>
        </ul>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.dataSecurity.title')}</h2>
        <p>{t('sections.dataSecurity.description')}</p>
        <ul className='list-disc pl-6 mt-4 space-y-3'>
          <li>
            <strong>{t('sections.dataSecurity.items.encryption.label')}</strong>{' '}
            {t('sections.dataSecurity.items.encryption.description')}
          </li>
          <li>
            <strong>{t('sections.dataSecurity.items.localStorage.label')}</strong>{' '}
            {t('sections.dataSecurity.items.localStorage.description')}
          </li>
          <li>
            <strong>{t('sections.dataSecurity.items.https.label')}</strong>{' '}
            {t('sections.dataSecurity.items.https.description')}
          </li>
          <li>
            <strong>{t('sections.dataSecurity.items.minimalCollection.label')}</strong>{' '}
            {t('sections.dataSecurity.items.minimalCollection.description')}
          </li>
        </ul>
        <p className='mt-4'>{t('sections.dataSecurity.disclaimer')}</p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.yourRights.title')}</h2>
        <p>{t('sections.yourRights.description')}</p>
        <ul className='list-disc pl-6 mt-4 space-y-3'>
          <li>
            <strong>{t('sections.yourRights.items.access.label')}</strong>{' '}
            {t('sections.yourRights.items.access.description')}
          </li>
          <li>
            <strong>{t('sections.yourRights.items.rectification.label')}</strong>{' '}
            {t('sections.yourRights.items.rectification.description')}
          </li>
          <li>
            <strong>{t('sections.yourRights.items.erasure.label')}</strong>{' '}
            {t('sections.yourRights.items.erasure.description')}
          </li>
          <li>
            <strong>{t('sections.yourRights.items.restrict.label')}</strong>{' '}
            {t('sections.yourRights.items.restrict.description')}
          </li>
          <li>
            <strong>{t('sections.yourRights.items.portability.label')}</strong>{' '}
            {t('sections.yourRights.items.portability.description')}
          </li>
          <li>
            <strong>{t('sections.yourRights.items.object.label')}</strong>{' '}
            {t('sections.yourRights.items.object.description')}
          </li>
          <li>
            <strong>{t('sections.yourRights.items.withdrawConsent.label')}</strong>{' '}
            {t('sections.yourRights.items.withdrawConsent.description')}
          </li>
          <li>
            <strong>{t('sections.yourRights.items.complaint.label')}</strong>{' '}
            {t('sections.yourRights.items.complaint.description')}
          </li>
        </ul>
        <p className='mt-4'>{t('sections.yourRights.contact')}</p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.internationalTransfers.title')}</h2>
        <p>{t('sections.internationalTransfers.p1')}</p>
        <p className='mt-4'>{t('sections.internationalTransfers.p2')}</p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.childrensPrivacy.title')}</h2>
        <p>{t('sections.childrensPrivacy.p1')}</p>
        <p className='mt-4'>{t('sections.childrensPrivacy.p2')}</p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.changes.title')}</h2>
        <p>{t('sections.changes.p1')}</p>
        <p className='mt-4'>{t('sections.changes.p2')}</p>
        <p className='mt-4'>{t('sections.changes.p3')}</p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.dataBreach.title')}</h2>
        <p>{t('sections.dataBreach.description')}</p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.contactInfo.title')}</h2>
        <p>{t('sections.contactInfo.description')}</p>
        <ul className='list-disc pl-6 mt-4 space-y-2'>
          <li>
            <strong>{t('sections.contactInfo.items.email.label')}</strong> {t('sections.contactInfo.items.email.value')}
          </li>
          <li>
            <strong>{t('sections.contactInfo.items.website.label')}</strong> https://forever-pto.com
          </li>
          <li>
            <strong>{t('sections.contactInfo.items.postalAddress.label')}</strong>{' '}
            {t('sections.contactInfo.items.postalAddress.value')}
          </li>
        </ul>
        <p className='mt-4'>{t('sections.contactInfo.responseTime')}</p>
      </section>
    </LegalLayout>
  );
}
