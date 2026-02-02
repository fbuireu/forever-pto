import { getTranslations } from 'next-intl/server';

import { Troubleshooting } from '@ui/modules/components/faq/Troubleshooting';
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from 'src/components/animate-ui/base/accordion';
import type { FaqData } from 'src/ui/modules/components/faq/types';
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

  return (
    <section
      aria-labelledby='faq-title'
      className='space-y-6 m-auto mt-8 max-w-4xl w-full scroll-mt-15 px-4 lg:px-0'
      id='faq'
    >
      <h2 id='faq-title' className='text-3xl font-semibold'>
        {t('title')}
      </h2>
      {FAQ.map((section) => (
        <div key={section.id}>
          <h3 className='text-2xl font-medium mb-4'>{section.title}</h3>
          <Accordion
            multiple
            className='w-full **:data-[slot="accordion-panel"]:data-open:overflow-visible **:data-[slot="accordion-panel"]:data-open:[mask:none!important] **:data-[slot="accordion-panel"]:data-open:mask-[none!important]'
          >
            {section.items.map((item) => (
              <AccordionItem key={item.id} value={item.id} className='cursor-pointer'>
                <AccordionTrigger className='text-left'>{item.question}</AccordionTrigger>
                <AccordionPanel className='text-muted-foreground'>{item.answer}</AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ))}
    </section>
  );
};
