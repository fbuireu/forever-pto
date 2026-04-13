'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from 'src/components/animate-ui/components/tabs';

type TabSection = {
  id: string;
  title: string;
  content: React.ReactNode;
};

type FaqTabsProps = {
  tabs: TabSection[];
  title: string;
};

export const FaqTabs = ({ tabs, title }: FaqTabsProps) => {
  const [active, setActive] = useState(tabs[0]?.id ?? '');

  return (
    <>
      <h2 id='faq-title' className='text-3xl font-semibold'>
        {title}
      </h2>
      <Tabs value={active} onValueChange={setActive}>
        <TabsList
          className='grid w-full'
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.title}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {tabs.map((tab) => (
        <div key={tab.id} role='tabpanel' hidden={tab.id !== active}>
          {tab.content}
        </div>
      ))}
    </>
  );
};
