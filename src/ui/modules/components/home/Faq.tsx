import { Troubleshooting } from '@ui/modules/components/faq/Troubleshooting';
import { FaqTabs } from '@ui/modules/components/faq/FaqTabs';
import type { FaqData } from '@ui/modules/components/faq/types';
import { getTranslations } from 'next-intl/server';
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from 'src/components/animate-ui/base/accordion';
import { Tutorial } from '../faq/Tutorial';
import { TutorialTrigger } from '../faq/TutorialTrigger';

export const Faq = async () => {
  const t = await getTranslations('faq');

  const FAQ: FaqData = [
    {
      id: 'general',
      title: t('sections.general.title'),
      items: [
        {
          id: 'what-is',
          question: t('sections.general.whatIs.question'),
          answer: t('sections.general.whatIs.answer'),
        },
        {
          id: 'how-works',
          question: t('sections.general.howWorks.question'),
          answer: <Tutorial />,
        },
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
        {
          id: 'restart-tutorial',
          question: t('sections.general.restartTutorial.question'),
          answer: <TutorialTrigger />,
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
      ],
    },
    {
      id: 'security',
      title: t('sections.security.title'),
      items: [
        {
          id: 'data',
          question: t('sections.security.data.question'),
          answer: t('sections.security.data.answer'),
        },
        {
          id: 'encryption',
          question: t('sections.security.encryption.question'),
          answer: t('sections.security.encryption.answer'),
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
          answer: t('sections.collaborate.code.answer'),
        },
        {
          id: 'business',
          question: t('sections.collaborate.business.question'),
          answer: t('sections.collaborate.business.answer'),
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
        className='w-full **:data-[slot="accordion-panel"]:data-open:overflow-visible **:data-[slot="accordion-panel"]:data-open:[mask:none!important] **:data-[slot="accordion-panel"]:data-open:mask-[none!important]'
      >
        {section.items.map((item) => (
          <AccordionItem key={item.id} value={item.id} className='cursor-pointer'>
            <AccordionTrigger className='text-left'>
              <h3 className='font-normal text-base'>{item.question}</h3>
            </AccordionTrigger>
            <AccordionPanel className='text-muted-foreground'>{item.answer}</AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    ),
  }));

  return (
    <section
      aria-labelledby='faq-title'
      className='space-y-6 m-auto mt-8 max-w-4xl w-full scroll-mt-15 px-4 lg:px-0'
      id='faq'
    >
      <FaqTabs tabs={tabs} title={t('title')} />
    </section>
  );
};
