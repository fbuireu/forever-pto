import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from '@ui/components/animate/base/accordion';
import { Badge } from '@ui/components/primitives/badge';
import { FaqTabs } from '@ui/modules/components/faq/FaqTabs';
import type { FaqData } from '@ui/modules/components/faq/types';
import { getTranslations } from 'next-intl/server';

export const LandingFaq = async () => {
  const t = await getTranslations('faq');
  const tLanding = await getTranslations('landing');

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
      ],
    },
    {
      id: 'security',
      title: t('sections.security.title'),
      items: [
        { id: 'data', question: t('sections.security.data.question'), answer: t('sections.security.data.answer') },
        {
          id: 'encryption',
          question: t('sections.security.encryption.question'),
          answer: t('sections.security.encryption.answer'),
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
    <section className='px-7 py-24' id='faq'>
      <div className='max-w-[900px] mx-auto mb-14 text-center'>
        <div className='flex justify-center mb-4'>
          <Badge variant='outline'>{tLanding('faq.badge')}</Badge>
        </div>
        <h2 className='font-display font-extrabold leading-none tracking-[-0.03em] text-[clamp(36px,5vw,64px)]'>
          {tLanding('faq.h2')}
        </h2>
      </div>

      <div className='max-w-4xl mx-auto space-y-6'>
        <FaqTabs tabs={tabs} />
      </div>
    </section>
  );
};
