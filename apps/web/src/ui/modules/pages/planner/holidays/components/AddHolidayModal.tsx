'use client';

import { useFiltersStore } from '@application/stores/filters';
import { useHolidaysStore } from '@application/stores/holidays';
import { Plus } from '@ui/modules/core/animate/icons/Plus';
import type { Locale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { useShallow } from 'zustand/react/shallow';
import { HolidayFormModal, HolidayFormMode } from './HolidayFormModal';

interface AddHolidayModalProps {
  open: boolean;
  onClose: () => void;
  locale: Locale;
}

export const AddHolidayModal = ({ open, onClose, locale }: AddHolidayModalProps) => {
  const t = useTranslations(HolidayFormMode.ADD);
  const addHoliday = useHolidaysStore((state) => state.addHoliday);
  const { carryOverMonths, year } = useFiltersStore(
    useShallow((state) => ({ carryOverMonths: state.carryOverMonths, year: state.year }))
  );

  return (
    <HolidayFormModal
      open={open}
      onClose={onClose}
      locale={locale}
      mode={HolidayFormMode.ADD}
      icon={<Plus className='size-5 text-primary' animateOnHover />}
      onCommit={(data) => addHoliday({ holiday: { name: data.name, date: data.date }, carryOverMonths, year })}
      successDescription={(data, formattedDate) => t('successDescription', { name: data.name, date: formattedDate })}
    />
  );
};
