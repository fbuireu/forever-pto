import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from '@ui/modules/core/animate/base/Accordion';
import { LazyMotionProvider } from '@ui/modules/core/animate/providers/LazyMotionProvider';
import { Demo } from '../Demo';

const ITEMS = [
  {
    id: 'how',
    question: 'How does the optimizer work?',
    answer:
      'It looks at public holidays and weekends, then places your PTO days where they bridge the longest streaks.',
  },
  {
    id: 'strategies',
    question: 'What are strategies?',
    answer: 'Grouped, Optimized and Balanced change how aggressively PTO days are clustered around holidays.',
  },
  {
    id: 'regions',
    question: 'Are regional holidays supported?',
    answer: 'Yes — pick a region and its holidays are merged with the national calendar.',
  },
];

export const AccordionDemo = () => (
  <Demo>
    <LazyMotionProvider>
      <Accordion className='w-full max-w-md'>
        {ITEMS.map((item) => (
          <AccordionItem key={item.id} value={item.id}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionPanel className='text-muted-foreground'>{item.answer}</AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </LazyMotionProvider>
  </Demo>
);

export const AccordionNoChevronDemo = () => (
  <Demo>
    <LazyMotionProvider>
      <Accordion className='w-full max-w-md'>
        <AccordionItem value='plain'>
          <AccordionTrigger chevron={false}>No chevron on this trigger</AccordionTrigger>
          <AccordionPanel className='text-muted-foreground'>
            Pass chevron={'{false}'} when the trigger supplies its own affordance.
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </LazyMotionProvider>
  </Demo>
);
