import { LegalLayout } from '@ui/modules/components/legal/LegalLayout';
import { getTranslations } from 'next-intl/server';

export { generateMetadata } from './metadata';

export default async function CookiePolicyPage() {
  const t = await getTranslations('legalPages.cookiePolicy');

  return (
    <LegalLayout title={t('title')} lastUpdated={t('lastUpdated')}>
      <section>
        <h2 className='text-2xl font-semibold mt-6 mb-4'>{t('sections.introduction.title')}</h2>
        <p>
          {t.rich('sections.introduction.p1', {
            link: (chunks) => (
              <a href='https://forever-pto.com' className='text-primary hover:underline'>
                {chunks}
              </a>
            ),
          })}
        </p>
        <p className='mt-4'>{t('sections.introduction.p2')}</p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.whatAreCookies.title')}</h2>
        <p>{t('sections.whatAreCookies.p1')}</p>
        <p className='mt-4'>{t('sections.whatAreCookies.p2')}</p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.typesOfCookies.title')}</h2>
        <p>{t('sections.typesOfCookies.intro')}</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>{t('sections.typesOfCookies.notUsed.advertising')}</li>
          <li>{t('sections.typesOfCookies.notUsed.tracking')}</li>
          <li>{t('sections.typesOfCookies.notUsed.analytics')}</li>
          <li>{t('sections.typesOfCookies.notUsed.socialMedia')}</li>
        </ul>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.typesOfCookies.strictlyNecessary.title')}</h3>
        <p>{t('sections.typesOfCookies.strictlyNecessary.description')}</p>
        <ul className='list-disc pl-6 mt-4 space-y-3'>
          <li>
            <strong>{t('sections.typesOfCookies.strictlyNecessary.items.filters.label')}</strong>{' '}
            {t('sections.typesOfCookies.strictlyNecessary.items.filters.description')}
          </li>
          <li>
            <strong>{t('sections.typesOfCookies.strictlyNecessary.items.holidays.label')}</strong>{' '}
            {t('sections.typesOfCookies.strictlyNecessary.items.holidays.description')}
          </li>
          <li>
            <strong>{t('sections.typesOfCookies.strictlyNecessary.items.location.label')}</strong>{' '}
            {t('sections.typesOfCookies.strictlyNecessary.items.location.description')}
          </li>
          <li>
            <strong>{t('sections.typesOfCookies.strictlyNecessary.items.premiumKey.label')}</strong>{' '}
            {t('sections.typesOfCookies.strictlyNecessary.items.premiumKey.description')}
          </li>
          <li>
            <strong>{t('sections.typesOfCookies.strictlyNecessary.items.theme.label')}</strong>{' '}
            {t('sections.typesOfCookies.strictlyNecessary.items.theme.description')}
          </li>
          <li>
            <strong>{t('sections.typesOfCookies.strictlyNecessary.items.calendar.label')}</strong>{' '}
            {t('sections.typesOfCookies.strictlyNecessary.items.calendar.description')}
          </li>
        </ul>
        <p className='mt-4'>
          <strong>{t('sections.typesOfCookies.strictlyNecessary.duration.label')}</strong>{' '}
          {t('sections.typesOfCookies.strictlyNecessary.duration.description')}
        </p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.cookieBanner.title')}</h2>
        <p>{t('sections.cookieBanner.description')}</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>
            <strong>{t('sections.cookieBanner.items.strictlyNecessary.label')}</strong>{' '}
            {t('sections.cookieBanner.items.strictlyNecessary.description')}
          </li>
          <li>
            <strong>{t('sections.cookieBanner.items.analytics.label')}</strong>{' '}
            {t('sections.cookieBanner.items.analytics.description')}
          </li>
        </ul>
        <p className='mt-4'>{t('sections.cookieBanner.consentStorage')}</p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.googleConsent.title')}</h2>
        <p>{t('sections.googleConsent.description')}</p>
        <ul className='list-disc pl-6 mt-4 space-y-3'>
          <li>
            <strong>{t('sections.googleConsent.states.default.label')}</strong>{' '}
            {t('sections.googleConsent.states.default.description')}
          </li>
          <li>
            <strong>{t('sections.googleConsent.states.grant.label')}</strong>{' '}
            {t('sections.googleConsent.states.grant.description')}
          </li>
          <li>
            <strong>{t('sections.googleConsent.states.denial.label')}</strong>{' '}
            {t('sections.googleConsent.states.denial.description')}
          </li>
          <li>
            <strong>{t('sections.googleConsent.states.pings.label')}</strong>{' '}
            {t('sections.googleConsent.states.pings.description')}
          </li>
        </ul>
        <p className='mt-4'>{t('sections.googleConsent.categoriesIntro')}</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>
            <strong>analytics_storage:</strong> {t('sections.googleConsent.categories.analyticsStorage')}
          </li>
          <li>
            <strong>ad_storage:</strong> {t('sections.googleConsent.categories.adStorage')}
          </li>
          <li>
            <strong>ad_user_data:</strong> {t('sections.googleConsent.categories.adUserData')}
          </li>
          <li>
            <strong>ad_personalization:</strong> {t('sections.googleConsent.categories.adPersonalization')}
          </li>
          <li>
            <strong>functionality_storage:</strong> {t('sections.googleConsent.categories.functionalityStorage')}
          </li>
          <li>
            <strong>personalization_storage:</strong> {t('sections.googleConsent.categories.personalizationStorage')}
          </li>
          <li>
            <strong>security_storage:</strong> {t('sections.googleConsent.categories.securityStorage')}
          </li>
        </ul>
        <p className='mt-4'>{t('sections.googleConsent.gdprCompliance')}</p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.dataSecurity.title')}</h2>
        <p>{t('sections.dataSecurity.description')}</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>{t('sections.dataSecurity.items.browserSpecific')}</li>
          <li>{t('sections.dataSecurity.items.notSynced')}</li>
          <li>{t('sections.dataSecurity.items.clearingData')}</li>
          <li>{t('sections.dataSecurity.items.noAccess')}</li>
        </ul>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.thirdPartyCookies.title')}</h2>
        <p>{t('sections.thirdPartyCookies.description')}</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>
            <strong>{t('sections.thirdPartyCookies.items.payment.label')}</strong>{' '}
            {t('sections.thirdPartyCookies.items.payment.description')}
          </li>
          <li>
            <strong>{t('sections.thirdPartyCookies.items.holidayApis.label')}</strong>{' '}
            {t('sections.thirdPartyCookies.items.holidayApis.description')}
          </li>
        </ul>
        <p className='mt-4'>{t('sections.thirdPartyCookies.disclaimer')}</p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.managingCookies.title')}</h2>
        <p>{t('sections.managingCookies.description')}</p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.managingCookies.browserSettings.title')}</h3>
        <p>{t('sections.managingCookies.browserSettings.description')}</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>{t('sections.managingCookies.browserSettings.items.view')}</li>
          <li>{t('sections.managingCookies.browserSettings.items.blockAll')}</li>
          <li>{t('sections.managingCookies.browserSettings.items.blockSpecific')}</li>
          <li>{t('sections.managingCookies.browserSettings.items.deleteOnClose')}</li>
        </ul>
        <p className='mt-4'>{t('sections.managingCookies.browserSettings.warning')}</p>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.managingCookies.browserInstructions.title')}</h3>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>
            <strong>Chrome:</strong> {t('sections.managingCookies.browserInstructions.chrome')}
          </li>
          <li>
            <strong>Firefox:</strong> {t('sections.managingCookies.browserInstructions.firefox')}
          </li>
          <li>
            <strong>Safari:</strong> {t('sections.managingCookies.browserInstructions.safari')}
          </li>
          <li>
            <strong>Edge:</strong> {t('sections.managingCookies.browserInstructions.edge')}
          </li>
        </ul>

        <h3 className='text-xl font-semibold mt-6 mb-3'>{t('sections.managingCookies.inAppManagement.title')}</h3>
        <p>{t('sections.managingCookies.inAppManagement.description')}</p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.yourRights.title')}</h2>
        <p>{t('sections.yourRights.description')}</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>{t('sections.yourRights.items.know')}</li>
          <li>{t('sections.yourRights.items.access')}</li>
          <li>{t('sections.yourRights.items.delete')}</li>
          <li>{t('sections.yourRights.items.withdrawConsent')}</li>
          <li>{t('sections.yourRights.items.object')}</li>
        </ul>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.changes.title')}</h2>
        <p>{t('sections.changes.p1')}</p>
        <p className='mt-4'>{t('sections.changes.p2')}</p>
      </section>

      <section>
        <h2 className='text-2xl font-semibold mt-8 mb-4'>{t('sections.contact.title')}</h2>
        <p>{t('sections.contact.description')}</p>
        <ul className='list-disc pl-6 mt-2 space-y-2'>
          <li>
            <strong>{t('sections.contact.email.label')}</strong> {t('sections.contact.email.value')}
          </li>
          <li>
            <strong>{t('sections.contact.website.label')}</strong> https://forever-pto.com
          </li>
        </ul>
      </section>
    </LegalLayout>
  );
}
