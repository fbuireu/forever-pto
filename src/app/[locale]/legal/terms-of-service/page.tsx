import { LegalLayout } from '@ui/modules/components/legal/LegalLayout';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'Terms of Service | Forever PTO',
  description: 'Terms and conditions for using Forever PTO',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function TermsOfServicePage() {
  const t = await getTranslations('legalPages.termsOfService');

  return (
    <LegalLayout title={t('title')} lastUpdated={t('lastUpdated')}>
      <section>
        <h2 className='text-2xl font-semibold mt-6 mb-4'>{t('sections.acceptance.title')}</h2>
        <p>{t('sections.acceptance.p1')}</p>
        <p className='mt-4'>{t('sections.acceptance.p2')}</p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.serviceDescription.title')}</h2>
        <p>{t('sections.serviceDescription.description')}</p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.serviceDescription.freeVersion.title')}</h3>
        <p>{t('sections.serviceDescription.freeVersion.description')}</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>{t('sections.serviceDescription.freeVersion.items.optimization')}</li>
          <li>{t('sections.serviceDescription.freeVersion.items.visualization')}</li>
          <li>{t('sections.serviceDescription.freeVersion.items.customHolidays')}</li>
          <li>{t('sections.serviceDescription.freeVersion.items.metrics')}</li>
          <li>{t('sections.serviceDescription.freeVersion.items.strategy')}</li>
        </ul>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.serviceDescription.premiumVersion.title')}</h3>
        <p>{t('sections.serviceDescription.premiumVersion.description')}</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>{t('sections.serviceDescription.premiumVersion.items.advancedMetrics')}</li>
          <li>{t('sections.serviceDescription.premiumVersion.items.charts')}</li>
          <li>{t('sections.serviceDescription.premiumVersion.items.efficiency')}</li>
          <li>{t('sections.serviceDescription.premiumVersion.items.strategies')}</li>
          <li>{t('sections.serviceDescription.premiumVersion.items.alternatives')}</li>
          <li>{t('sections.serviceDescription.premiumVersion.items.analysis')}</li>
          <li>{t('sections.serviceDescription.premiumVersion.items.customization')}</li>
        </ul>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.eligibility.title')}</h2>
        <p>{t('sections.eligibility.p1')}</p>
        <p className='mt-4'>{t('sections.eligibility.p2')}</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>{t('sections.eligibility.items.age')}</li>
          <li>{t('sections.eligibility.items.legalCapacity')}</li>
          <li>{t('sections.eligibility.items.compliance')}</li>
          <li>{t('sections.eligibility.items.lawfulUse')}</li>
        </ul>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.premiumPayments.title')}</h2>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.premiumPayments.activation.title')}</h3>
        <p>{t('sections.premiumPayments.activation.description')}</p>
        <p className='mt-4'>{t('sections.premiumPayments.activation.characteristics')}</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>{t('sections.premiumPayments.activation.items.oneTime')}</li>
          <li>{t('sections.premiumPayments.activation.items.lifetime')}</li>
          <li>{t('sections.premiumPayments.activation.items.personal')}</li>
          <li>{t('sections.premiumPayments.activation.items.multiDevice')}</li>
        </ul>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.premiumPayments.pricing.title')}</h3>
        <p>{t('sections.premiumPayments.pricing.p1')}</p>
        <p className='mt-4'>{t('sections.premiumPayments.pricing.p2')}</p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.premiumPayments.processing.title')}</h3>
        <p>{t('sections.premiumPayments.processing.description')}</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>Stripe</li>
          <li>PayPal</li>
          <li>{t('sections.premiumPayments.processing.items.other')}</li>
        </ul>
        <p className='mt-4'>{t('sections.premiumPayments.processing.p1')}</p>
        <p className='mt-4'>{t('sections.premiumPayments.processing.p2')}</p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.premiumPayments.keySecurity.title')}</h3>
        <p>{t('sections.premiumPayments.keySecurity.p1')}</p>
        <p className='mt-4'>{t('sections.premiumPayments.keySecurity.p2')}</p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.refundPolicy.title')}</h2>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.refundPolicy.eligibility.title')}</h3>
        <p>{t('sections.refundPolicy.eligibility.description')}</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>{t('sections.refundPolicy.eligibility.items.technical')}</li>
          <li>{t('sections.refundPolicy.eligibility.items.notAsDescribed')}</li>
          <li>{t('sections.refundPolicy.eligibility.items.accidental')}</li>
          <li>{t('sections.refundPolicy.eligibility.items.notSatisfied')}</li>
        </ul>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.refundPolicy.exclusions.title')}</h3>
        <p>{t('sections.refundPolicy.exclusions.description')}</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>{t('sections.refundPolicy.exclusions.items.timePassed')}</li>
          <li>{t('sections.refundPolicy.exclusions.items.violatedTerms')}</li>
          <li>{t('sections.refundPolicy.exclusions.items.sharedKey')}</li>
          <li>{t('sections.refundPolicy.exclusions.items.fraudulent')}</li>
        </ul>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.refundPolicy.process.title')}</h3>
        <p>{t('sections.refundPolicy.process.description')}</p>
        <ol className='list-decimal pl-6 mt-2 space-y-2'>
          <li>{t('sections.refundPolicy.process.steps.contact')}</li>
          <li>{t('sections.refundPolicy.process.steps.include')}</li>
          <li>{t('sections.refundPolicy.process.steps.review')}</li>
          <li>{t('sections.refundPolicy.process.steps.processing')}</li>
        </ol>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.refundPolicy.postRefund.title')}</h3>
        <p>{t('sections.refundPolicy.postRefund.description')}</p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.refundPolicy.euRights.title')}</h3>
        <p>{t('sections.refundPolicy.euRights.p1')}</p>
        <p className='mt-4'>{t('sections.refundPolicy.euRights.p2')}</p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.userResponsibilities.title')}</h2>
        <p>{t('sections.userResponsibilities.description')}</p>
        <ul className='list-disc pl-6 mt-4 space-y-2'>
          <li>{t('sections.userResponsibilities.items.compliance')}</li>
          <li>{t('sections.userResponsibilities.items.noHarm')}</li>
          <li>{t('sections.userResponsibilities.items.noUnauthorizedAccess')}</li>
          <li>{t('sections.userResponsibilities.items.noBots')}</li>
          <li>{t('sections.userResponsibilities.items.noReverseEngineer')}</li>
          <li>{t('sections.userResponsibilities.items.noShare')}</li>
          <li>{t('sections.userResponsibilities.items.verifyHolidays')}</li>
          <li>{t('sections.userResponsibilities.items.noIllegal')}</li>
        </ul>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.disclaimer.title')}</h2>
        <p>{t('sections.disclaimer.description')}</p>
        <ul className='list-disc pl-6 mt-4 space-y-3'>
          <li>
            <strong>{t('sections.disclaimer.items.accuracy.label')}</strong>{' '}
            {t('sections.disclaimer.items.accuracy.description')}
          </li>
          <li>
            <strong>{t('sections.disclaimer.items.availability.label')}</strong>{' '}
            {t('sections.disclaimer.items.availability.description')}
          </li>
          <li>
            <strong>{t('sections.disclaimer.items.fitness.label')}</strong>{' '}
            {t('sections.disclaimer.items.fitness.description')}
          </li>
          <li>
            <strong>{t('sections.disclaimer.items.dataIntegrity.label')}</strong>{' '}
            {t('sections.disclaimer.items.dataIntegrity.description')}
          </li>
        </ul>
        <p className='mt-4'>{t('sections.disclaimer.acknowledgement')}</p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.limitationOfLiability.title')}</h2>
        <p>{t('sections.limitationOfLiability.description')}</p>
        <ul className='list-disc pl-6 mt-4 space-y-2'>
          <li>{t('sections.limitationOfLiability.items.profits')}</li>
          <li>{t('sections.limitationOfLiability.items.dataLoss')}</li>
          <li>{t('sections.limitationOfLiability.items.employment')}</li>
          <li>{t('sections.limitationOfLiability.items.interruptions')}</li>
          <li>{t('sections.limitationOfLiability.items.unauthorizedAccess')}</li>
        </ul>
        <p className='mt-4'>{t('sections.limitationOfLiability.maxLiability')}</p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.intellectualProperty.title')}</h2>
        <p>{t('sections.intellectualProperty.description')}</p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.intellectualProperty.limitedLicense.title')}</h3>
        <p>{t('sections.intellectualProperty.limitedLicense.description')}</p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.intellectualProperty.openSource.title')}</h3>
        <p>
          {t.rich('sections.intellectualProperty.openSource.description', {
            link: (chunks) => (
              <a
                href='https://github.com/fbuireu/forever-pto'
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary hover:underline'
              >
                {chunks}
              </a>
            ),
          })}
        </p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.intellectualProperty.restrictions.title')}</h3>
        <p>{t('sections.intellectualProperty.restrictions.description')}</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>{t('sections.intellectualProperty.restrictions.items.copy')}</li>
          <li>{t('sections.intellectualProperty.restrictions.items.derivative')}</li>
          <li>{t('sections.intellectualProperty.restrictions.items.remove')}</li>
          <li>{t('sections.intellectualProperty.restrictions.items.trademarks')}</li>
        </ul>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.thirdPartyServices.title')}</h2>
        <p>{t('sections.thirdPartyServices.description')}</p>
        <ul className='list-disc pl-6 mt-4 space-y-2'>
          <li>{t('sections.thirdPartyServices.items.payment')}</li>
          <li>{t('sections.thirdPartyServices.items.holidayApis')}</li>
          <li>{t('sections.thirdPartyServices.items.analytics')}</li>
          <li>{t('sections.thirdPartyServices.items.external')}</li>
        </ul>
        <p className='mt-4'>{t('sections.thirdPartyServices.disclaimer1')}</p>
        <p className='mt-4'>{t('sections.thirdPartyServices.disclaimer2')}</p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.modifications.title')}</h2>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.modifications.serviceModifications.title')}</h3>
        <p>{t('sections.modifications.serviceModifications.description')}</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>{t('sections.modifications.serviceModifications.items.modify')}</li>
          <li>{t('sections.modifications.serviceModifications.items.changeFeatures')}</li>
          <li>{t('sections.modifications.serviceModifications.items.updatePricing')}</li>
          <li>{t('sections.modifications.serviceModifications.items.impose')}</li>
        </ul>
        <p className='mt-4'>{t('sections.modifications.serviceModifications.notice')}</p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.modifications.terminationByUs.title')}</h3>
        <p>{t('sections.modifications.terminationByUs.description')}</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>{t('sections.modifications.terminationByUs.items.violateTerms')}</li>
          <li>{t('sections.modifications.terminationByUs.items.fraudulent')}</li>
          <li>{t('sections.modifications.terminationByUs.items.shareKey')}</li>
          <li>{t('sections.modifications.terminationByUs.items.requiredByLaw')}</li>
          <li>{t('sections.modifications.terminationByUs.items.discontinue')}</li>
        </ul>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.modifications.terminationByYou.title')}</h3>
        <p>{t('sections.modifications.terminationByYou.description')}</p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.modifications.effectOfTermination.title')}</h3>
        <p>{t('sections.modifications.effectOfTermination.description')}</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>{t('sections.modifications.effectOfTermination.items.rightsCease')}</li>
          <li>{t('sections.modifications.effectOfTermination.items.keyDeactivated')}</li>
          <li>{t('sections.modifications.effectOfTermination.items.dataRemains')}</li>
          <li>{t('sections.modifications.effectOfTermination.items.provisions')}</li>
        </ul>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.indemnification.title')}</h2>
        <p>{t('sections.indemnification.description')}</p>
        <ul className='list-disc pl-6 mt-4 space-y-2'>
          <li>{t('sections.indemnification.items.misuse')}</li>
          <li>{t('sections.indemnification.items.violateTerms')}</li>
          <li>{t('sections.indemnification.items.violateRights')}</li>
          <li>{t('sections.indemnification.items.violateLaws')}</li>
        </ul>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.governingLaw.title')}</h2>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.governingLaw.law.title')}</h3>
        <p>{t('sections.governingLaw.law.description')}</p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.governingLaw.jurisdiction.title')}</h3>
        <p>{t('sections.governingLaw.jurisdiction.description')}</p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.governingLaw.disputeResolution.title')}</h3>
        <p>{t('sections.governingLaw.disputeResolution.description')}</p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.governingLaw.euOdr.title')}</h3>
        <p>
          {t.rich('sections.governingLaw.euOdr.description', {
            link: (chunks) => (
              <a
                href='https://ec.europa.eu/consumers/odr'
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary hover:underline'
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.severability.title')}</h2>
        <p>{t('sections.severability.description')}</p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.entireAgreement.title')}</h2>
        <p>{t('sections.entireAgreement.description')}</p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.waiver.title')}</h2>
        <p>{t('sections.waiver.description')}</p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.changes.title')}</h2>
        <p>{t('sections.changes.p1')}</p>
        <p className='mt-4'>{t('sections.changes.p2')}</p>
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
