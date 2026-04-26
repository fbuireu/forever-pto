'use client';

import { HolidayVariant } from '@application/dto/holiday/types';
import { useHolidaysStore } from '@application/stores/holidays';
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsHighlight,
  TabsHighlightItem,
  TabsList,
  TabsTrigger,
} from '@ui/modules/core/animate/components/Tabs';
import { PremiumFeature } from '@ui/modules/premium/PremiumFeature';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { HolidaysTable } from './holidays/HolidaysTable';

export const HolidaysList = () => {
  const t = useTranslations('holidaysTable');
  const holidays = useHolidaysStore((state) => state.holidays);
  const [activeTab, setActiveTab] = useState<HolidayVariant>(HolidayVariant.NATIONAL);
  const regionalHolidays = holidays.filter((holiday) => holiday.variant === HolidayVariant.REGIONAL);

  const handleTabChange = (value: string) => {
    const variant = value as HolidayVariant;
    if (variant === HolidayVariant.REGIONAL && regionalHolidays.length === 0) return;
    setActiveTab(variant);
  };

  return (
    <div className='rounded-lg w-full col-span-full z-1 bg-background' data-tutorial='holidays-list'>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsHighlight>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsHighlightItem value={HolidayVariant.NATIONAL}>
              <TabsTrigger value={HolidayVariant.NATIONAL}>{t('nationalTab')}</TabsTrigger>
            </TabsHighlightItem>
            {regionalHolidays.length > 0 ? (
              <TabsHighlightItem value={HolidayVariant.REGIONAL}>
                <TabsTrigger value={HolidayVariant.REGIONAL}>{t('regionalTab')}</TabsTrigger>
              </TabsHighlightItem>
            ) : (
              <div className='inline-flex cursor-not-allowed items-center size-full justify-center whitespace-nowrap rounded-sm px-2 py-1 text-sm font-medium opacity-50'>
                {t('regionalTab')}
              </div>
            )}
            <PremiumFeature
              feature={t('customHolidaysFeature')}
              description={t('customHolidaysDescription')}
              className='p-0'
            >
              <TabsHighlightItem value={HolidayVariant.CUSTOM}>
                <TabsTrigger value={HolidayVariant.CUSTOM}>{t('customTab')}</TabsTrigger>
              </TabsHighlightItem>
            </PremiumFeature>
          </TabsList>
        </TabsHighlight>
        <TabsContents className='mx-1 mb-1 rounded-sm bg-background py-4'>
          <TabsContent value={HolidayVariant.NATIONAL}>
            <HolidaysTable variant={HolidayVariant.NATIONAL} title={t('nationalTitle')} open />
          </TabsContent>
          <TabsContent value={HolidayVariant.REGIONAL}>
            <HolidaysTable variant={HolidayVariant.REGIONAL} title={t('regionalTitle')} open />
          </TabsContent>
          <TabsContent value={HolidayVariant.CUSTOM}>
            <HolidaysTable variant={HolidayVariant.CUSTOM} title={t('customTitle')} open />
          </TabsContent>
        </TabsContents>
      </Tabs>
    </div>
  );
};
