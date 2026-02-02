'use client';

import { HolidayVariant } from '@application/dto/holiday/types';
import { useHolidaysStore } from '@application/stores/holidays';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from 'src/components/animate-ui/components/tabs';
import { HolidaysTable } from '../holidaysList/HolidaysTable';
import { PremiumFeature } from '../premium/PremiumFeature';

export const HolidaysList = () => {
  const t = useTranslations('holidaysTable');
  const holidays = useHolidaysStore((state) => state.holidays);
  const [activeTab, setActiveTab] = useState<HolidayVariant>(HolidayVariant.NATIONAL);
  const regionalHolidays = holidays.filter((holiday) => holiday.variant === HolidayVariant.REGIONAL);

  const handleTabChange = (value: string) => {
    const variant = value as HolidayVariant;

    if (variant === HolidayVariant.REGIONAL && regionalHolidays.length === 0) {
      return;
    }

    setActiveTab(variant);
  };

  return (
    <div className='rounded-lg w-full col-span-full z-1 bg-background'>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value={HolidayVariant.NATIONAL}>{t('nationalTab')}</TabsTrigger>
          {regionalHolidays.length > 0 ? (
            <TabsTrigger value={HolidayVariant.REGIONAL}>{t('regionalTab')}</TabsTrigger>
          ) : (
            <div className='inline-flex cursor-not-allowed items-center size-full justify-center whitespace-nowrap rounded-sm px-2 py-1 text-sm font-medium opacity-50'>
              {t('regionalTab')}
            </div>
          )}
          <PremiumFeature feature={t('customHolidaysFeature')} description={t('customHolidaysDescription')} className='p-0'>
            <TabsTrigger value={HolidayVariant.CUSTOM}>{t('customTab')}</TabsTrigger>
          </PremiumFeature>
        </TabsList>
      </Tabs>
      <div className='mx-1 mb-1 rounded-sm h-full bg-background space-y-6 py-4'>
        {activeTab === HolidayVariant.NATIONAL && (
          <HolidaysTable
            variant={HolidayVariant.NATIONAL}
            title={t('nationalTitle')}
            open={activeTab === HolidayVariant.NATIONAL}
          />
        )}
        {activeTab === HolidayVariant.REGIONAL && (
          <HolidaysTable
            variant={HolidayVariant.REGIONAL}
            title={t('regionalTitle')}
            open={activeTab === HolidayVariant.REGIONAL}
          />
        )}
        {activeTab === HolidayVariant.CUSTOM && (
          <HolidaysTable
            variant={HolidayVariant.CUSTOM}
            title={t('customTitle')}
            open={activeTab === HolidayVariant.CUSTOM}
          />
        )}
      </div>
    </div>
  );
};
