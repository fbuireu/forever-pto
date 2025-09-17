'use client';

import { HolidayVariant } from '@application/dto/holiday/types';
import { Link } from '@application/i18n/navigtion';
import { useHolidaysStore } from '@application/stores/holidays';
import { cn } from '@const/lib/utils';
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from 'src/components/animate-ui/components/tabs';
import { HolidaysTable } from '../holidaysList/HolidaysTable';
import { PremiumFeature } from '../premium/PremiumFeature';

export const HolidaysList = () => {
  const holidays = useHolidaysStore((state) => state.holidays);
  const [activeTab, setActiveTab] = useState<HolidayVariant>(HolidayVariant.NATIONAL);
  const regionalHolidays = holidays.filter((holiday) => holiday.variant === HolidayVariant.REGIONAL);

  const handleTabChange = (value: HolidayVariant) => {
    setActiveTab(value);
  };

  return (
    <div className='rounded-lg w-full'>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value={HolidayVariant.NATIONAL}>National</TabsTrigger>
          <TabsTrigger
            value={HolidayVariant.REGIONAL}
            className={cn(!regionalHolidays.length && 'opacity-50 pointer-events-none cursor-not-allowed')}
          >
            Regional
          </TabsTrigger>
          <PremiumFeature
            feature='Custom Holidays'
            description='Allows to add custom holidays. This is useful when the provided data is inaccurate or when you want to add your specific details into account'
            className='p-0'
          >
            <TabsTrigger value={HolidayVariant.CUSTOM}>Custom</TabsTrigger>
          </PremiumFeature>
        </TabsList>
      </Tabs>
      <Link className='text-xs text-muted-foreground hover:underline' href='#faq'>
        Doubts? Check our FAQs
      </Link>
      <div className='mx-1 mb-1 rounded-sm h-full bg-background space-y-6 py-4'>
        {activeTab === HolidayVariant.NATIONAL && (
          <HolidaysTable
            variant={HolidayVariant.NATIONAL}
            title='Festivos Nacionales'
            open={activeTab === HolidayVariant.NATIONAL}
          />
        )}
        {activeTab === HolidayVariant.REGIONAL && (
          <HolidaysTable
            variant={HolidayVariant.REGIONAL}
            title='Festivos Regionales'
            open={activeTab === HolidayVariant.REGIONAL}
          />
        )}
        {activeTab === HolidayVariant.CUSTOM && (
          <HolidaysTable
            variant={HolidayVariant.CUSTOM}
            title='Festivos Personalizados'
            open={activeTab === HolidayVariant.CUSTOM}
          />
        )}
      </div>
    </div>
  );
};
