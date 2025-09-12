'use client';

import { HolidayVariant } from '@application/dto/holiday/types';
import { useHolidaysStore } from '@application/stores/holidays';
import { cn } from '@const/lib/utils';
import { Tabs, TabsContent, TabsContents, TabsList, TabsTrigger } from 'src/components/animate-ui/components/tabs';
import { HolidaysTable } from '../holidaysList/HolidaysTable';
import { PremiumFeature } from '../premium/PremiumFeature';

export const HolidaysList = () => {
  const { holidays } = useHolidaysStore();
  const regionalHolidays = holidays.filter((holiday) => holiday.variant === HolidayVariant.REGIONAL);

  return (
    <Tabs defaultValue='national' className='rounded-lg w-full overflow-hidden'>
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
      <TabsContents className='mx-1 mb-1 -mt-2 rounded-sm h-full bg-background'>
        <TabsContent value={HolidayVariant.NATIONAL} className='space-y-6 py-6'>
          <HolidaysTable variant={HolidayVariant.NATIONAL} title='Festivos Nacionales' />
        </TabsContent>
        <TabsContent value={HolidayVariant.REGIONAL} className='space-y-6 py-6'>
          <HolidaysTable variant={HolidayVariant.REGIONAL} title='Festivos Regionales' />
        </TabsContent>
        <TabsContent value={HolidayVariant.CUSTOM} className='space-y-6 py-6'>
          <HolidaysTable variant={HolidayVariant.CUSTOM} title='Festivos Personalizados' />
        </TabsContent>
      </TabsContents>
    </Tabs>
  );
};
