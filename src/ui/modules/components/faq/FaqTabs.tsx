'use client';

import { Tabs, TabsList, TabsTrigger } from '@ui/components/animate/components/tabs';
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
        <TabsList
          className='grid w-full'
          activeClassName='bg-[var(--accent)] border-[2px] border-[var(--frame)] rounded-[6px] shadow-[var(--shadow-brutal-xs)]'
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
