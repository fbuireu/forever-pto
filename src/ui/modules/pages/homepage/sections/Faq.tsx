import { Link } from '@application/i18n/navigation';
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from '@ui/modules/core/animate/base/Accordion';
import { Badge } from '@ui/modules/core/primitives/Badge';
import { FaqTabs } from '@ui/modules/pages/planner/support/FaqTabs';
import { Troubleshooting } from '@ui/modules/pages/planner/support/Troubleshooting';
import type { FaqData } from '@ui/modules/pages/planner/support/types';
import { getTranslations } from 'next-intl/server';

const GITHUB_ISSUE_URL =
  'https://github.com/fbuireu/forever-pto/issues/new?template=feature_request.yml&labels=enhancement';

export const Faq = async () => {
  const [t, tLanding] = await Promise.all([getTranslations('faq'), getTranslations('homepage')]);

  const FAQ: FaqData = [
    {
      id: 'general',
      title: t('sections.general.title'),
      items: [
        { id: 'what-is', question: t('sections.general.whatIs.question'), answer: t('sections.general.whatIs.answer') },
        {
          id: 'why',
          question: t('sections.general.whyNotSeeingCountry.question'),
          answer: t('sections.general.whyNotSeeingCountry.answer'),
        },
        {
          id: 'pricing',
          question: t('sections.general.pricing.question'),
          answer: t('sections.general.pricing.answer'),
        },
      ],
    },
    {
      id: 'technical',
      title: t('sections.technical.title'),
      items: [
        {
          id: 'algorithms',
          question: t('sections.technical.algorithms.question'),
          answer: t('sections.technical.algorithms.answer'),
        },
        {
          id: 'strategies',
          question: t('sections.technical.strategies.question'),
          answer: t('sections.technical.strategies.answer'),
        },
        {
          id: 'results',
          question: t('sections.technical.results.question'),
          answer: t('sections.technical.results.answer'),
        },
      ],
    },
    {
      id: 'security',
      title: t('sections.security.title'),
      items: [
        {
          id: 'data',
          question: t('sections.security.data.question'),
          answer: t.rich('sections.security.data.answer', {
            privacyLink: (chunks) => (
              <Link
                href='/legal/privacy-policy'
                className='text-sm font-medium px-1.5 py-0.5 border-[3px] border-transparent rounded-[8px] hover:bg-[var(--accent)] hover:border-[var(--frame)] hover:text-accent-foreground transition-[background-color,border-color,color] duration-75'
              >
                {chunks}
              </Link>
            ),
          }),
        },
        {
          id: 'encryption',
          question: t('sections.security.encryption.question'),
          answer: t('sections.security.encryption.answer'),
        },
        {
          id: 'tracking',
          question: t('sections.security.tracking.question'),
          answer: t('sections.security.tracking.answer'),
        },
        {
          id: 'troubleshooting',
          question: t('sections.security.troubleshooting.question'),
          answer: <Troubleshooting />,
        },
      ],
    },
    {
      id: 'collaborate',
      title: t('sections.collaborate.title'),
      items: [
        {
          id: 'code',
          question: t('sections.collaborate.code.question'),
          answer: t.rich('sections.collaborate.code.answer', {
            link: (chunks) => (
              <a
                href={GITHUB_ISSUE_URL}
                target='_blank'
                rel='noopener noreferrer'
                className='text-sm font-semibold px-1.5 py-0.5 border-[3px] border-transparent rounded-[8px] hover:bg-[var(--accent)] hover:border-[var(--frame)] hover:text-accent-foreground transition-[background-color,border-color,color] duration-75'
              >
                {chunks}
              </a>
            ),
          }),
        },
        {
          id: 'business',
          question: t('sections.collaborate.business.question'),
          answer: t('sections.collaborate.business.answer'),
        },
        {
          id: 'non-code',
          question: t('sections.collaborate.nonCode.question'),
          answer: t('sections.collaborate.nonCode.answer'),
        },
      ],
    },
  ];

  const tabs = FAQ.map((section) => ({
    id: section.id,
    title: section.title,
    content: (
      <Accordion
        multiple
        className='w-full **:data-[slot="accordion-panel"]:data-open:overflow-visible **:data-[slot="accordion-panel"]:data-open:[mask:none!important]'
      >
        {section.items.map((item) => (
          <AccordionItem key={item.id} value={item.id} className='cursor-pointer'>
            <AccordionTrigger className='text-left'>
              <span className='font-normal text-base'>{item.question}</span>
            </AccordionTrigger>
            <AccordionPanel className='text-muted-foreground pt-1'>{item.answer}</AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    ),
  }));

  return (
    <section className='px-7 py-24' id='faq'>
      <div className='max-w-[900px] mx-auto mb-14 text-center'>
        <div className='flex justify-center mb-4'>
          <Badge variant='outline'>{tLanding('faq.badge')}</Badge>
        </div>
        <h2 className='font-display font-semibold leading-none tracking-[-0.03em] text-[clamp(36px,5vw,64px)]'>
          {tLanding('faq.title')}
        </h2>
      </div>

      <div className='max-w-[1240px] mx-auto w-full space-y-6'>
        <FaqTabs tabs={tabs} />
      </div>
    </section>
  );
};
