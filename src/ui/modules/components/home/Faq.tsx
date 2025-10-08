import { Troubleshooting } from '@ui/modules/components/faq/Troubleshooting';
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from 'src/components/animate-ui/base/accordion';
import type { FaqData } from 'src/ui/modules/components/faq/types';

const FAQ: FaqData = [
  {
    id: 'technical',
    title: 'Technical',
    items: [
      {
        id: 'algorithms',
        question: 'How does the suggestion algorithm work?',
        answer:
          'The system analyzes available workdays, holidays and user preferences (e.g. avoiding past days) to produce PTO combinations that maximize effective time off. It applies heuristics based on efficiency and scoring to prioritize bridges and grouped days.',
      },
      {
        id: 'strategies',
        question: 'What is the difference between "balanced" and "optimized" strategies?',
        answer:
          'Balanced aims to spread time off across the year for steady value, while Optimized focuses on maximizing efficiency (effective days per PTO day) by prioritizing the best ratio combinations.',
      },
      {
        id: 'overlap',
        question: 'How do you avoid overlapping suggestions?',
        answer:
          'We keep a cache of generated combinations and a set of already-selected dates; when producing alternatives we filter out bridges that include used dates to avoid overlaps and ensure variety.',
      },
      {
        id: 'encryption',
        question: 'Is my data encrypted?',
        answer:
          "Your vacation planning data is stored locally in your browser. In production, we apply XOR cipher obfuscation to make the data unreadable in casual inspection. This is method is designed to prevent accidental exposure, not protect against determined attackers. We don't store sensitive personal information, and you maintain full control of your data on your device.",
      },
      {
        id: 'data-privacy',
        question: 'What data do you store?',
        answer:
          "All your data (PTO days, selected dates, custom holidays, preferences) is stored exclusively in your browser's local storage. We never send this information to our servers. Your vacation planning stays completely private on your device.",
      },
    ],
  },
  {
    id: 'general',
    title: 'General',
    items: [
      {
        id: 'why',
        question: "Why I'm not seeing my country holidays correctly?",
        answer:
          'For simplicity and performance we use a third-party tool to get the bank holidays for a given country and year. It may happen that your country is not supported or the data is not up to date. You can always get premium by making a donation and add those days as "custom holidays" in our system ',
      },
      {
        id: 'what',
        question: 'What is Forever PTO?',
        answer:
          'Forever PTO is a tool to plan and optimize your time off. It helps find holiday combinations that leverage public holidays and maximize your free time.',
      },
      {
        id: 'pricing',
        question: 'Why is there a paid model?',
        answer:
          "Maintaining data, infrastructure and continuous improvements requires resources. The paid model funds updates, support and hosting. We also offer a free tier with core features to ensure everyone can benefit from better PTO planning.If you want to go ad free and support the project there's a volunteer donation",
      },
      {
        id: 'scope',
        question: 'What is included and what is not?',
        answer:
          'Includes suggestion generation, calendar export and preference customization. Does not include direct management of company permissions or automatic integration with all HR systems.',
      },
    ],
  },
  {
    id: 'collaborate',
    title: 'Interested in collaborating?',
    items: [
      {
        id: 'code',
        question: 'How to contribute code or ideas?',
        answer:
          'Open issues or merge requests with proposals. We need help on algorithms, integrations and UX improvements.',
      },
      {
        id: 'business',
        question: 'Propose integrations or corporate partnerships',
        answer:
          'If you represent a company and want to integrate Forever PTO, contact support or open a proposal for a custom integration.',
      },
    ],
  },
  {
    id: 'security',
    title: 'Security & privacy',
    items: [
      {
        id: 'data',
        question: 'How do you handle my data?',
        answer:
          'We store only the minimum information required to generate suggestions. We do not share data with third parties without consent. See the privacy policy for full details.',
      },
      {
        id: 'troubleshooting',
        question: 'Troubleshooting & stale client data',
        answer: <Troubleshooting />,
      },
    ],
  },
];

export const Faq = () => {
  return (
    <section aria-labelledby='faq-title' className='space-y-6 m-auto mt-8 max-w-4xl w-full scroll-mt-[60px]' id='faq'>
      <h2 id='faq-title' className='text-3xl font-semibold'>
        Preguntas frecuentes
      </h2>
      {FAQ.map((section) => (
        <div key={section.id}>
          <h3 className='text-2xl font-medium mb-4'>{section.title}</h3>
          <Accordion
            multiple
            className='w-full [mask:none!important] [&_[data-slot="accordion-panel"]]:overflow-visible [&_[data-slot="accordion-panel"]]:[mask:none!important]'
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
