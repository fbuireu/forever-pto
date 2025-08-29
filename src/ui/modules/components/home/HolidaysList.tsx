import { HolidayVariant } from '@application/dto/holiday/types';
import { Tabs, TabsContent, TabsContents, TabsList, TabsTrigger } from 'src/components/animate-ui/components/tabs';
import { HolidaysTable } from '../holidaysList/holidaysTable';

export const HolidaysList = () => {
  return (
    <Tabs defaultValue='national' className='rounded-lg w-full'>
      <TabsList className='grid w-full grid-cols-3'>
        <TabsTrigger value='national'>National</TabsTrigger>
        <TabsTrigger value='regional'>Regional</TabsTrigger>
        <TabsTrigger value='custom'>Custom</TabsTrigger>
      </TabsList>
      <TabsContents className='mx-1 mb-1 -mt-2 rounded-sm h-full bg-background'>
        <TabsContent value='national' className='space-y-6 py-6'>
          <HolidaysTable variant={HolidayVariant.NATIONAL} />
        </TabsContent>
        <TabsContent value='regional' className='space-y-6 py-6'>
          content 2
        </TabsContent>
      </TabsContents>
    </Tabs>
  );
};
