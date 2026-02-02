'use client';

import type { HolidayDTO } from '@application/dto/holiday/types';
import { HolidayVariant } from '@application/dto/holiday/types';
import { useHolidaysStore } from '@application/stores/holidays';
import { usePremiumStore } from '@application/stores/premium';
import { Badge } from '@const/components/ui/badge';
import { Input } from '@const/components/ui/input';
import { Table, TableBody, TableCell, TableRow } from '@const/components/ui/table';
import { cn } from '@const/lib/utils';
import { useDebounce } from '@ui/hooks/useDebounce';
import { ConditionalWrapper } from '@ui/modules/components/core/ConditionalWrapper';
import { PremiumFeature, PremiumFeatureVariant } from '@ui/modules/components/premium/PremiumFeature';
import { isWeekend } from 'date-fns/isWeekend';
import { Edit } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Checkbox } from 'src/components/animate-ui/base/checkbox';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import { ChevronDown } from 'src/components/animate-ui/icons/chevron-down';
import { ChevronRight } from 'src/components/animate-ui/icons/chevron-right';
import { AnimateIcon } from 'src/components/animate-ui/icons/icon';
import { Plus } from 'src/components/animate-ui/icons/plus';
import { Search } from 'src/components/animate-ui/icons/search';
import { Trash2 } from 'src/components/animate-ui/icons/trash-2';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from 'src/components/animate-ui/radix/collapsible';
import { HolidayRow } from './components/HolidayRow';
import { HolidayTableHeader } from './components/HolidayTableHeader';

interface HolidaysTableProps {
  title: string;
  variant: HolidayVariant;
  open: boolean;
}

const AddHolidayModal = dynamic(() =>
  import('./components/AddHolidayModal').then((module) => ({ default: module.AddHolidayModal }))
);
const EditHolidayModal = dynamic(() =>
  import('./components/EditHolidayModal').then((module) => ({ default: module.EditHolidayModal }))
);
const DeleteHolidayModal = dynamic(() =>
  import('./components/DeleteHolidayModal').then((module) => ({ default: module.DeleteHolidayModal }))
);

const HolidayCard = ({
  holiday,
  index,
  isSelected,
  locale,
  onToggle,
  premiumKey,
  t,
}: {
  holiday: HolidayDTO;
  index: number;
  isSelected: boolean;
  locale: string;
  onToggle: (holiday: HolidayDTO, index: number) => void;
  premiumKey: string | null;
  t: ReturnType<typeof useTranslations<'holidaysTable'>>;
}) => {
  const dateFormatted = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(holiday.date);

  return (
    <div
      className={cn('border rounded-lg p-4 space-y-3 transition-colors', isSelected && 'bg-muted/50 border-primary')}
    >
      <div className='flex items-start justify-between gap-2'>
        <div className='flex items-start gap-3 flex-1 min-w-0'>
          <ConditionalWrapper
            doWrap={!premiumKey}
            wrapper={(children) => (
              <PremiumFeature feature='Select Holiday' variant={PremiumFeatureVariant.STACK} iconSize='size-4'>
                {children}
              </PremiumFeature>
            )}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggle(holiday, index)}
              className='mt-1 flex-shrink-0'
            />
          </ConditionalWrapper>
          <div className='flex-1 min-w-0'>
            <h4 className='font-medium text-sm leading-tight break-words'>{holiday.name}</h4>
            <p className='text-xs text-muted-foreground mt-1'>{dateFormatted}</p>
          </div>
        </div>
        {holiday.type && (
          <Badge variant='secondary' className='flex-shrink-0 text-xs self-center'>
            {holiday.type}
          </Badge>
        )}
      </div>

      <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
        {holiday.location && <span className='flex items-center gap-1'>📍 {holiday.location}</span>}
        {isWeekend(holiday.date) && (
          <Badge variant='outline' className='text-xs'>
            {t('weekend')}
          </Badge>
        )}
      </div>
    </div>
  );
};

export const HolidaysTable = ({ title, variant, open }: HolidaysTableProps) => {
  const premiumKey = usePremiumStore((state) => state.premiumKey);
  const holidays = useHolidaysStore((state) => state.holidays);

  const locale = useLocale();
  const t = useTranslations('holidaysTable');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [innerOpen, setInnerOpen] = useState(false);
  const [selectedHolidays, setSelectedHolidays] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{
    key: keyof HolidayDTO | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  const [debouncedSearchTerm] = useDebounce({
    value: searchTerm,
    delay: 100,
    callback: () => {},
  });

  const prevOpen = useRef(open);

  useEffect(() => {
    if (prevOpen.current && !open) {
      setInnerOpen(false);
    }
    prevOpen.current = open;
  }, [open]);

  const variantHolidays = useMemo(
    () => holidays.filter((holiday) => holiday.variant === variant && holiday.isInSelectedRange),
    [variant, holidays]
  );

  const filteredHolidays = useMemo(() => {
    let filtered = variantHolidays.filter(
      (holiday) =>
        holiday.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        holiday.type?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        holiday.location?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );

    if (sortConfig.key) {
      const sortKey = sortConfig.key;
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortKey];
        const bValue = b[sortKey];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        let comparison = 0;
        if (sortKey === 'date') {
          comparison = new Date(aValue as Date).getTime() - new Date(bValue as Date).getTime();
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else {
          comparison = Math.sign(Number(aValue) - Number(bValue));
        }

        return sortConfig.direction === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [variantHolidays, debouncedSearchTerm, sortConfig]);

  const handleSort = useCallback((key: keyof HolidayDTO) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const getHolidayId = useCallback((holiday: HolidayDTO, index: number) => {
    return `${holiday.name}-${holiday.date.getTime()}-${index}`;
  }, []);

  const selectionState = useMemo(() => {
    if (filteredHolidays.length === 0) {
      return { type: 'none' as const, count: 0 };
    }

    const selectedCount = filteredHolidays.filter((holiday, index) =>
      selectedHolidays.has(getHolidayId(holiday, index))
    ).length;

    if (selectedCount === 0) {
      return { type: 'none' as const, count: 0 };
    } else if (selectedCount === filteredHolidays.length) {
      return { type: 'all' as const, count: selectedCount };
    } else {
      return { type: 'some' as const, count: selectedCount };
    }
  }, [filteredHolidays, selectedHolidays, getHolidayId]);

  const toggleSelectAll = useCallback(() => {
    setSelectedHolidays((prev) => {
      const newSelected = new Set(prev);

      if (selectionState.type === 'all') {
        filteredHolidays.forEach((holiday, index) => newSelected.delete(getHolidayId(holiday, index)));
      } else {
        filteredHolidays.forEach((holiday, index) => newSelected.add(getHolidayId(holiday, index)));
      }

      return newSelected;
    });
  }, [filteredHolidays, selectionState.type, getHolidayId]);

  const toggleSelectHoliday = useCallback(
    (holiday: HolidayDTO, index: number) => {
      setSelectedHolidays((prev) => {
        const holidayId = getHolidayId(holiday, index);
        const newSelected = new Set(prev);

        if (newSelected.has(holidayId)) {
          newSelected.delete(holidayId);
        } else {
          newSelected.add(holidayId);
        }

        return newSelected;
      });
    },
    [getHolidayId]
  );

  const handleCloseAddModal = useCallback(() => {
    setShowAddModal(false);
    setSelectedHolidays(new Set());
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setSelectedHolidays(new Set());
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setSelectedHolidays(new Set());
  }, []);

  const getSelectedHolidays = useCallback(() => {
    return filteredHolidays.filter((holiday, index) => selectedHolidays.has(getHolidayId(holiday, index)));
  }, [filteredHolidays, selectedHolidays, getHolidayId]);

  const selectedHolidaysList = useMemo(() => getSelectedHolidays(), [getSelectedHolidays]);

  const SelectAllButton = useMemo(() => {
    const { type } = selectionState;

    const getLabel = () => {
      switch (type) {
        case 'none':
          return t('selectAll');
        case 'some':
          return t('partialSelection');
        case 'all':
          return t('deselectAll');
      }
    };

    return (
      <ConditionalWrapper
        doWrap={!premiumKey}
        wrapper={(children) => (
          <PremiumFeature feature='Select All Holidays' variant={PremiumFeatureVariant.STACK} iconSize='size-4'>
            {children}
          </PremiumFeature>
        )}
      >
        <Checkbox
          checked={type === 'all'}
          indeterminate={type === 'some'}
          onCheckedChange={toggleSelectAll}
          aria-label={getLabel()}
          title={getLabel()}
        />
      </ConditionalWrapper>
    );
  }, [selectionState, toggleSelectAll, premiumKey, t]);

  const selectedCount = selectedHolidays.size;
  const shouldShowLocationColumn = variantHolidays.some((h) => h.location);
  const weekendCount = variantHolidays.filter((h) => isWeekend(h.date)).length;
  const workdayCount = variantHolidays.filter((h) => !isWeekend(h.date)).length;

  return (
    <Collapsible open={innerOpen} onOpenChange={setInnerOpen} className='space-y-4 w-full'>
      <AnimateIcon animateOnHover>
        <CollapsibleTrigger asChild className='cursor-pointer'>
          <div className='flex items-center justify-between cursor-pointer group hover:bg-muted/50 p-3 rounded-lg border transition-colors'>
            <div className='flex items-center space-x-3 w-full'>
              <div className='flex items-center space-x-2'>
                {innerOpen ? (
                  <ChevronDown className='h-4 w-4 text-muted-foreground transition-transform' />
                ) : (
                  <ChevronRight className='h-4 w-4 text-muted-foreground transition-transform' />
                )}
                <h3 className='text-base sm:text-lg font-semibold truncate'>{title}</h3>
              </div>
              <div className='flex items-center space-x-2 ml-auto flex-shrink-0'>
                <Badge variant='outline' className='text-xs sm:text-sm'>
                  {variantHolidays.length} total
                </Badge>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
      </AnimateIcon>
      {innerOpen && (
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4'>
          <div className='flex flex-wrap items-center gap-2 w-full sm:w-auto'>
            {variant === HolidayVariant.CUSTOM && (
              <AnimateIcon animateOnHover>
                <Button
                  size='sm'
                  onClick={() => setShowAddModal(true)}
                  className='bg-green-600 hover:bg-green-700 text-white'
                >
                  <Plus className='h-4 w-4 mr-1' />
                  <span className='hidden xs:inline'>{t('addHoliday')}</span>
                  <span className='xs:hidden'>{t('add')}</span>
                </Button>
              </AnimateIcon>
            )}
            {selectedCount === 1 && (
              <AnimateIcon animateOnHover>
                <Button variant='outline' size='sm' onClick={() => setShowEditModal(true)} className='py-4'>
                  <Edit className='h-4 w-4 mr-1' />
                  <span className='hidden xs:inline'>{t('editHoliday')}</span>
                  <span className='xs:hidden'>{t('edit')}</span>
                </Button>
              </AnimateIcon>
            )}
            {selectedCount > 0 && (
              <div className='flex items-center space-x-2'>
                <AnimateIcon animateOnHover>
                  <Button variant='destructive' size='sm' onClick={() => setShowDeleteModal(true)}>
                    <Trash2 className='h-4 w-4 mr-1' />
                    <span className='hidden xs:inline'>{t('deleteHolidays', { count: selectedCount })}</span>
                    <span className='xs:hidden'>{t('delete')} ({selectedCount})</span>
                  </Button>
                </AnimateIcon>
              </div>
            )}
          </div>
          <div className='relative w-full sm:w-64'>
            <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-8 w-full'
            />
          </div>
        </div>
      )}
      <CollapsibleContent className='space-y-4 overflow-hidden'>
        {innerOpen && (
          <>
            <div className='hidden lg:block rounded-md border max-h-96 overflow-hidden'>
              <div className='max-h-96 overflow-y-auto'>
                <Table className='w-full'>
                  <colgroup>
                    <col className='w-[50px]' />
                    <col className='w-[300px]' />
                    <col className='w-[120px]' />
                    <col className='w-[100px]' />
                    <col className='w-[80px]' />
                    <col className='w-[100px]' />
                    {shouldShowLocationColumn && <col className='w-[150px]' />}
                  </colgroup>
                  <HolidayTableHeader
                    selectAllButton={SelectAllButton}
                    shouldShowLocationColumn={shouldShowLocationColumn}
                    variant={variant}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <TableBody>
                    {filteredHolidays.length > 0 ? (
                      filteredHolidays.map((holiday, index) => {
                        const holidayId = getHolidayId(holiday, index);
                        const isSelected = selectedHolidays.has(holidayId);

                        return (
                          <HolidayRow
                            key={holidayId}
                            holiday={holiday}
                            index={index}
                            isSelected={isSelected}
                            locale={locale}
                            onToggle={toggleSelectHoliday}
                          />
                        );
                      })
                    ) : (
                      <AnimateIcon animateOnView loop loopDelay={1500} asChild>
                        <TableRow>
                          <TableCell colSpan={shouldShowLocationColumn ? 7 : 6} className='h-24 text-center'>
                            <div className='flex flex-col items-center space-y-2 text-muted-foreground'>
                              <Search className='h-8 w-8' />
                              {debouncedSearchTerm ? t('noHolidaysFound') : t('noHolidays')}
                            </div>
                          </TableCell>
                        </TableRow>
                      </AnimateIcon>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className='lg:hidden space-y-3'>
              <div className='flex items-center justify-between px-2 py-1 bg-muted/30 rounded-md'>
                <div className='flex items-center gap-2'>
                  {SelectAllButton}
                  <span className='text-xs text-muted-foreground'>
                    {selectionState.type === 'all'
                      ? t('allSelected')
                      : selectionState.type === 'some'
                        ? `${selectionState.count} ${t('selected')}`
                        : t('selectAll')}
                  </span>
                </div>
              </div>

              <div className='space-y-2 max-h-96 overflow-y-auto px-1'>
                {filteredHolidays.length > 0 ? (
                  filteredHolidays.map((holiday, index) => {
                    const holidayId = getHolidayId(holiday, index);
                    const isSelected = selectedHolidays.has(holidayId);

                    return (
                      <HolidayCard
                        key={holidayId}
                        holiday={holiday}
                        index={index}
                        isSelected={isSelected}
                        locale={locale}
                        onToggle={toggleSelectHoliday}
                        premiumKey={premiumKey}
                        t={t}
                      />
                    );
                  })
                ) : (
                  <div className='flex flex-col items-center justify-center py-12 text-muted-foreground'>
                    <Search className='h-8 w-8 mb-2' />
                    <p className='text-sm'>
                      {debouncedSearchTerm ? t('noHolidaysFound') : t('noHolidays')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground px-1'>
          <div className='flex flex-wrap items-center gap-2 sm:gap-4'>
            <span className='whitespace-nowrap'>{t('onWeekends')}: {weekendCount}</span>
            <span className='whitespace-nowrap'>{t('onWorkdays')}: {workdayCount}</span>
          </div>
          <div className='flex items-center space-x-2'>
            <span className='whitespace-nowrap'>
              {t('showing')} {filteredHolidays.length} {t('of')} {variantHolidays.length}
            </span>
          </div>
        </div>
      </CollapsibleContent>
      <AddHolidayModal open={showAddModal} onClose={handleCloseAddModal} locale={locale} />
      {selectedHolidaysList.length === 1 && (
        <EditHolidayModal
          open={showEditModal}
          onClose={handleCloseEditModal}
          locale={locale}
          holiday={selectedHolidaysList[0]}
        />
      )}
      <DeleteHolidayModal
        open={showDeleteModal}
        onClose={handleCloseDeleteModal}
        locale={locale}
        holidays={selectedHolidaysList}
      />
    </Collapsible>
  );
};
