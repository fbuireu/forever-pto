'use client';

import { HolidayVariant } from '@application/dto/holiday/types';
import { useHolidaysStore } from '@application/stores/holidays';
import { cn } from '@const/lib/utils';
import { Tabs, TabsContent, TabsContents, TabsList, TabsTrigger } from 'src/components/animate-ui/components/tabs';
import { HolidaysTable } from '../holidaysList/HolidaysTable';

export const HolidaysList = () => {
  const { holidays } = useHolidaysStore();
  const regionalHolidays = holidays.filter((holiday) => holiday.variant === HolidayVariant.REGIONAL);
  const customHolidays = holidays.filter((holiday) => holiday.variant === HolidayVariant.CUSTOM);

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
        <TabsTrigger
          value={HolidayVariant.CUSTOM}
          className={cn(!customHolidays.length && 'opacity-50 pointer-events-none cursor-not-allowed')}
        >
          Custom
        </TabsTrigger>
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
