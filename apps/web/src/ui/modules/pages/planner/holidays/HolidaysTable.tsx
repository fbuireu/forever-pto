import { formatDate } from '@application/shared/utils/dates';

('use client');

import type { HolidayDTO } from '@application/dto/holiday/types';
import { HolidayVariant } from '@application/dto/holiday/types';
import { isWeekend } from '@application/shared/utils/dates';
import { useHolidaysStore } from '@application/stores/holidays';
import { useDebounce } from '@ui/hooks/useDebounce';
import { Checkbox } from '@ui/modules/core/animate/base/Checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@ui/modules/core/animate/base/Collapsible';
import { ChevronDown } from '@ui/modules/core/animate/icons/ChevronDown';
import { ChevronRight } from '@ui/modules/core/animate/icons/ChevronRight';
import { AnimateIcon } from '@ui/modules/core/animate/icons/Icon';
import { Plus } from '@ui/modules/core/animate/icons/Plus';
import { Search } from '@ui/modules/core/animate/icons/Search';
import { Trash2 } from '@ui/modules/core/animate/icons/Trash2';
import { Badge } from '@ui/modules/core/primitives/Badge';
import { Button } from '@ui/modules/core/primitives/Button';
import { Input } from '@ui/modules/core/primitives/Input';
import { Table, TableBody, TableCell, TableRow } from '@ui/modules/core/primitives/Table';
import { PremiumFeature, PremiumFeatureVariant } from '@ui/modules/premium/PremiumFeature';
import { cn } from '@ui/utils/cn';
import { Edit } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const _holidayDateFmtCache = new Map<string, Intl.DateTimeFormat>();

const HolidayCard = ({
  holiday,
  isSelected,
  locale,
  onToggle,
  t,
  tPremium,
}: {
  holiday: HolidayDTO;
  isSelected: boolean;
  locale: string;
  onToggle: (holiday: HolidayDTO) => void;
  t: ReturnType<typeof useTranslations<'holidaysTable'>>;
  tPremium: ReturnType<typeof useTranslations<'premium'>>;
}) => {
  const dateFormatted = formatDate({ date: holiday.date, locale, format: 'EEEE, MMMM d, yyyy' });

  return (
    <div
      className={cn(
        'rounded-[12px] border-[3px] border-[var(--frame)] bg-card p-4 space-y-3 shadow-[var(--shadow-brutal-sm)] transition-colors',
        isSelected && 'bg-[var(--surface-panel-alt)]'
      )}
    >
      <div className='flex items-start justify-between gap-2'>
        <div className='flex items-start gap-3 flex-1 min-w-0'>
          <PremiumFeature feature={tPremium('selectHoliday')} variant={PremiumFeatureVariant.STACK} iconSize='size-4'>
            <Checkbox checked={isSelected} onCheckedChange={() => onToggle(holiday)} className='mt-1 shrink-0' />
          </PremiumFeature>
          <div className='flex-1 min-w-0'>
            <h4 className='font-medium text-sm leading-tight wrap-break-word'>{holiday.name}</h4>
            <p className='text-xs text-muted-foreground mt-1'>{dateFormatted}</p>
          </div>
        </div>
        {holiday.type && (
          <Badge variant='secondary' className='shrink-0 text-xs self-center'>
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
  const holidays = useHolidaysStore((state) => state.holidays);

  const locale = useLocale();
  const t = useTranslations('holidaysTable');
  const tPremium = useTranslations('premium');
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
      filtered = filtered.toSorted((a, b) => {
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

  const getHolidayId = useCallback((holiday: HolidayDTO) => `${holiday.id}::${holiday.name}`, []);

  const selectionState = useMemo(() => {
    if (filteredHolidays.length === 0) {
      return { type: 'none' as const, count: 0 };
    }

    const selectedCount = filteredHolidays.filter((holiday) => selectedHolidays.has(getHolidayId(holiday))).length;

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
        filteredHolidays.forEach((holiday) => {
          newSelected.delete(getHolidayId(holiday));
        });
      } else {
        filteredHolidays.forEach((holiday) => {
          newSelected.add(getHolidayId(holiday));
        });
      }

      return newSelected;
    });
  }, [filteredHolidays, selectionState.type, getHolidayId]);

  const toggleSelectHoliday = useCallback(
    (holiday: HolidayDTO) => {
      setSelectedHolidays((prev) => {
        const holidayId = getHolidayId(holiday);
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

  const selectedHolidaysList = useMemo(
    () => variantHolidays.filter((holiday) => selectedHolidays.has(getHolidayId(holiday))),
    [variantHolidays, selectedHolidays, getHolidayId]
  );

  const selectAllButton = useMemo(() => {
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
      <PremiumFeature feature={tPremium('selectAllHolidays')} variant={PremiumFeatureVariant.STACK} iconSize='size-4'>
        <Checkbox
          checked={type === 'all'}
          indeterminate={type === 'some'}
          onCheckedChange={toggleSelectAll}
          aria-label={getLabel()}
          title={getLabel()}
        />
      </PremiumFeature>
    );
  }, [selectionState, toggleSelectAll, t, tPremium]);

  const selectedCount = selectedHolidaysList.length;
  const weekendCount = variantHolidays.filter((h) => isWeekend(h.date)).length;
  const workdayCount = variantHolidays.filter((h) => !isWeekend(h.date)).length;

  return (
    <Collapsible open={innerOpen} onOpenChange={setInnerOpen} className='space-y-4 w-full'>
      <AnimateIcon animateOnHover>
        <CollapsibleTrigger className='flex items-center justify-between cursor-pointer group p-4 rounded-[12px] border-[3px] border-[var(--frame)] bg-card shadow-[var(--shadow-brutal-sm)] transition-colors w-full text-left hover:bg-[var(--surface-panel-alt)]'>
          <span className='flex items-center gap-x-3 w-full'>
            <span className='flex items-center gap-x-2'>
              {innerOpen ? (
                <ChevronDown className='size-4 text-muted-foreground transition-transform' />
              ) : (
                <ChevronRight className='size-4 text-muted-foreground transition-transform' />
              )}
              <span className='text-base sm:text-lg font-semibold truncate'>{title}</span>
            </span>
            <span className='flex items-center gap-x-2 ml-auto shrink-0'>
              <Badge variant='outline' className='text-xs sm:text-sm'>
                {variantHolidays.length} total
              </Badge>
            </span>
          </span>
        </CollapsibleTrigger>
      </AnimateIcon>
      {innerOpen && (
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4'>
          <div className='flex flex-wrap items-center gap-2 w-full sm:w-auto'>
            {variant === HolidayVariant.CUSTOM && (
              <AnimateIcon animateOnTap>
                <Button
                  size='sm'
                  onClick={() => setShowAddModal(true)}
                  className='bg-[var(--color-brand-teal)] text-[var(--color-brand-ink)] hover:bg-[var(--color-brand-teal)] hover:text-[var(--color-brand-ink)]'
                >
                  <Plus className='size-4 mr-1' />
                  <span className='hidden xs:inline'>{t('addHoliday')}</span>
                  <span className='xs:hidden'>{t('add')}</span>
                </Button>
              </AnimateIcon>
            )}
            {selectedCount === 1 && (
              <AnimateIcon animateOnHover>
                <Button variant='outline' size='sm' onClick={() => setShowEditModal(true)} className='py-4'>
                  <Edit className='size-4 mr-1' />
                  <span className='hidden xs:inline'>{t('editHoliday')}</span>
                  <span className='xs:hidden'>{t('edit')}</span>
                </Button>
              </AnimateIcon>
            )}
            {selectedCount > 0 && (
              <div className='flex items-center gap-x-2'>
                <AnimateIcon animateOnHover>
                  <Button variant='destructive' size='sm' onClick={() => setShowDeleteModal(true)}>
                    <Trash2 className='size-4 mr-1' />
                    <span className='hidden xs:inline'>{t('deleteHolidays', { count: selectedCount })}</span>
                    <span className='xs:hidden'>
                      {t('delete')} ({selectedCount})
                    </span>
                  </Button>
                </AnimateIcon>
              </div>
            )}
          </div>
          <div className='relative w-full sm:w-64'>
            <Search className='absolute left-2 top-2.5 size-4 text-muted-foreground' />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              inputMode='text'
              autoComplete='off'
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-8 w-full'
            />
          </div>
        </div>
      )}
      <CollapsibleContent className='space-y-4 overflow-hidden'>
        {innerOpen && (
          <>
            <div className='hidden lg:block'>
              <Table className='w-full' containerClassName='max-h-96 overflow-auto'>
                <colgroup>
                  <col className='w-12.5' />
                  <col className='w-75' />
                  <col className='w-30' />
                  <col className='w-25' />
                  <col className='w-20' />
                  <col className='w-25' />
                </colgroup>
                <HolidayTableHeader selectAllButton={selectAllButton} sortConfig={sortConfig} onSort={handleSort} />
                <TableBody>
                  {filteredHolidays.length > 0 ? (
                    filteredHolidays.map((holiday) => {
                      const holidayId = getHolidayId(holiday);
                      const isSelected = selectedHolidays.has(holidayId);

                      return (
                        <HolidayRow
                          key={holidayId}
                          holiday={holiday}
                          isSelected={isSelected}
                          locale={locale}
                          onToggle={toggleSelectHoliday}
                        />
                      );
                    })
                  ) : (
                    <AnimateIcon animateOnView animateOnViewOnce asChild>
                      <TableRow>
                        <TableCell colSpan={6} className='h-24 text-center'>
                          <div className='flex flex-col items-center gap-y-2 text-muted-foreground'>
                            <Search className='size-8' />
                            {debouncedSearchTerm ? t('noHolidaysFound') : t('noHolidays')}
                          </div>
                        </TableCell>
                      </TableRow>
                    </AnimateIcon>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className='lg:hidden space-y-3'>
              <div className='flex items-center justify-between rounded-[10px] border-[3px] border-[var(--frame)] bg-[var(--surface-panel-soft)] px-3 py-2 shadow-[var(--shadow-brutal-xs)]'>
                <div className='flex items-center gap-2'>
                  {selectAllButton}
                  <span className='text-xs text-muted-foreground'>
                    {selectionState.type === 'all'
                      ? t('allSelected')
                      : selectionState.type === 'some'
                        ? `${selectionState.count} ${t('selected')}`
                        : t('selectAll')}
                  </span>
                </div>
              </div>

              <div className='space-y-3 max-h-96 overflow-y-auto px-1'>
                {filteredHolidays.length > 0 ? (
                  filteredHolidays.map((holiday) => {
                    const holidayId = getHolidayId(holiday);
                    const isSelected = selectedHolidays.has(holidayId);

                    return (
                      <HolidayCard
                        key={holidayId}
                        holiday={holiday}
                        isSelected={isSelected}
                        locale={locale}
                        onToggle={toggleSelectHoliday}
                        t={t}
                        tPremium={tPremium}
                      />
                    );
                  })
                ) : (
                  <div className='flex flex-col items-center justify-center py-12 text-muted-foreground'>
                    <Search className='size-8 mb-2' />
                    <p className='text-sm'>{debouncedSearchTerm ? t('noHolidaysFound') : t('noHolidays')}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground px-1'>
          <div className='flex flex-wrap items-center gap-2 sm:gap-4'>
            <span className='whitespace-nowrap'>
              {t('onWeekends')}: {weekendCount}
            </span>
            <span className='whitespace-nowrap'>
              {t('onWorkdays')}: {workdayCount}
            </span>
          </div>
          <div className='flex items-center gap-x-2'>
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
