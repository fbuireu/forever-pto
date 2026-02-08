import { Nif } from '@ui/modules/components/core/Nif';
import { Me } from '@ui/modules/components/core/me';
import { LegalLayout } from '@ui/modules/components/legal/LegalLayout';
import { getTranslations } from 'next-intl/server';

export { generateMetadata } from './metadata';

export default async function LegalNoticePage() {
  const t = await getTranslations('legalPages.legalNotice');

  return (
    <LegalLayout title={t('title')} lastUpdated={t('lastUpdated')}>
      <section>
        <h2 className='text-2xl font-semibold mt-6 mb-4'>{t('sections.identification.title')}</h2>
        <p>{t('sections.identification.description')}</p>
        <ul className='list-disc pl-6 mt-4 space-y-2'>
          <li>
            <span className='inline-flex items-center gap-1'>
              <strong>{t('sections.identification.items.owner.label')}</strong>{' '}
              <Me ariaLabel={t('sections.identification.items.owner.label')} />
            </span>
          </li>
          <li>
            <span className='inline-flex items-center gap-1'>
              <strong>{t('sections.identification.items.taxId.label')}</strong>{' '}
              <Nif ariaLabel={t('sections.identification.items.taxId.label')} />
            </span>
          </li>
          <li>
            <strong>{t('sections.identification.items.email.label')}</strong>{' '}
            {t('sections.identification.items.email.value')}
          </li>
          <li>
            <strong>{t('sections.identification.items.website.label')}</strong> https://forever-pto.com
          </li>
        </ul>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.purpose.title')}</h2>
        <p>{t('sections.purpose.description')}</p>
        <p className='mt-4'>{t('sections.purpose.offers')}</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>
            <strong>{t('sections.purpose.items.freeVersion.label')}</strong>{' '}
            {t('sections.purpose.items.freeVersion.description')}
          </li>
          <li>
            <strong>{t('sections.purpose.items.premiumVersion.label')}</strong>{' '}
            {t('sections.purpose.items.premiumVersion.description')}
          </li>
        </ul>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.accessConditions.title')}</h2>
        <p>{t('sections.accessConditions.description')}</p>
        <p className='mt-4'>{t('sections.accessConditions.userAgreement')}</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>{t('sections.accessConditions.items.correctUse')}</li>
          <li>{t('sections.accessConditions.items.noIllegal')}</li>
          <li>{t('sections.accessConditions.items.noVirus')}</li>
          <li>{t('sections.accessConditions.items.noUnauthorized')}</li>
          <li>{t('sections.accessConditions.items.noShareKey')}</li>
        </ul>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.liability.title')}</h2>
        <p>{t('sections.liability.description')}</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>{t('sections.liability.items.accuracy')}</li>
          <li>{t('sections.liability.items.decisions')}</li>
          <li>{t('sections.liability.items.interruptions')}</li>
          <li>{t('sections.liability.items.misuse')}</li>
          <li>{t('sections.liability.items.thirdParty')}</li>
        </ul>
        <p className='mt-4'>{t('sections.liability.disclaimer')}</p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.intellectualProperty.title')}</h2>
        <p>{t('sections.intellectualProperty.p1')}</p>
        <p className='mt-4'>{t('sections.intellectualProperty.p2')}</p>
        <p className='mt-4'>
          {t.rich('sections.intellectualProperty.p3', {
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
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.thirdPartyLinks.title')}</h2>
        <p>{t('sections.thirdPartyLinks.p1')}</p>
        <p className='mt-4'>{t('sections.thirdPartyLinks.p2')}</p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.modifications.title')}</h2>
        <p>{t('sections.modifications.p1')}</p>
        <p className='mt-4'>{t('sections.modifications.p2')}</p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.applicableLaw.title')}</h2>
        <p>{t('sections.applicableLaw.description')}</p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.contact.title')}</h2>
        <p>{t('sections.contact.description')}</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>
            <strong>{t('sections.contact.items.email.label')}</strong> {t('sections.contact.items.email.value')}
          </li>
        </ul>
      </section>
    </LegalLayout>
  );
}
