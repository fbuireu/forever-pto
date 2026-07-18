import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsHighlight,
  TabsHighlightItem,
  TabsList,
  TabsTrigger,
} from '@ui/modules/core/animate/components/Tabs';
import { LazyMotionProvider } from '@ui/modules/core/animate/providers/LazyMotionProvider';
import { Demo } from '../Demo';

const TABS = [
  {
    id: 'grouped',
    label: 'Grouped',
    content: 'Clusters PTO days into a few long breaks around holidays.',
  },
  {
    id: 'optimized',
    label: 'Optimized',
    content: 'Maximizes total days off, even if breaks end up scattered.',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    content:
      'A middle ground: decent streaks, spread across the year. It trades a little efficiency for regular rests, which is why the panel height animates when you switch here.',
  },
];

export const TabsDemo = () => (
  <Demo>
    <LazyMotionProvider>
      <Tabs defaultValue={TABS[0].id} className='w-full max-w-md'>
        <TabsHighlight>
          <TabsList>
            {TABS.map((tab) => (
              <TabsHighlightItem key={tab.id} value={tab.id}>
                <TabsTrigger value={tab.id}>{tab.label}</TabsTrigger>
              </TabsHighlightItem>
            ))}
          </TabsList>
        </TabsHighlight>
        <TabsContents>
          {TABS.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className='py-2 text-sm text-muted-foreground'>
              {tab.content}
            </TabsContent>
          ))}
        </TabsContents>
      </Tabs>
    </LazyMotionProvider>
  </Demo>
);
