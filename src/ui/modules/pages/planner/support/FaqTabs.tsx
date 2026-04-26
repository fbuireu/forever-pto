'use client';

import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsHighlight,
  TabsHighlightItem,
  TabsList,
  TabsTrigger,
} from '@ui/modules/core/animate/components/Tabs';
import { useState } from 'react';

type TabSection = {
  id: string;
  title: string;
  content: React.ReactNode;
};

type FaqTabsProps = {
  tabs: TabSection[];
  title?: string;
};

export const FaqTabs = ({ tabs, title }: FaqTabsProps) => {
  const [active, setActive] = useState(tabs[0]?.id ?? '');

  return (
    <>
      {title && (
        <h2 id='faq-title' className='text-3xl font-semibold text-center'>
          {title}
        </h2>
      )}
      <Tabs value={active} onValueChange={setActive}>
        <TabsHighlight>
          <TabsList className='grid w-full' style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
            {tabs.map((tab) => (
              <TabsHighlightItem key={tab.id} value={tab.id}>
                <TabsTrigger value={tab.id}>{tab.title}</TabsTrigger>
              </TabsHighlightItem>
            ))}
          </TabsList>
        </TabsHighlight>
        <TabsContents>
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              {tab.content}
            </TabsContent>
          ))}
        </TabsContents>
      </Tabs>
    </>
  );
};
