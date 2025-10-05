'use client';

import type { HolidayDTO } from '@application/dto/holiday/types';
import { HolidayVariant } from '@application/dto/holiday/types';
import { Badge } from '@const/components/ui/badge';
import { Input } from '@const/components/ui/input';
import { Table, TableBody, TableCell, TableRow } from '@const/components/ui/table';
import { useDebounce } from '@ui/hooks/useDebounce';
import { ConditionalWrapper } from '@ui/modules/components/core/ConditionalWrapper';
import { PremiumFeature, PremiumFeatureVariant } from '@ui/modules/components/premium/PremiumFeature';
import { isWeekend } from 'date-fns/isWeekend';
import { ChevronDown, ChevronRight, Edit, Plus, Search, Trash2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Checkbox } from 'src/components/animate-ui/base/checkbox';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from 'src/components/animate-ui/radix/collapsible';
import { HolidayRow } from './components/HolidayRow';
import { HolidayTableHeader } from './components/HolidayTableHeader';
import { usePremiumStore } from '@application/stores/premium';
import { useHolidaysStore } from '@application/stores/holidays';

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

export const HolidaysTable = ({ title, variant, open }: HolidaysTableProps) => {
const premiumKey = usePremiumStore((state) => state.premiumKey);
const holidays = useHolidaysStore((state) => state.holidays);
  const locale = useLocale();
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

  const variantHolidays = useMemo(() => holidays.filter((holiday) => holiday.variant === variant), [variant, holidays]);

  const filteredHolidays = useMemo(() => {
    let filtered = variantHolidays.filter(
      (holiday) =>
        holiday.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ??
        holiday.type?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ??
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
    const newSelected = new Set(selectedHolidays);

    if (selectionState.type === 'all') {
      filteredHolidays.forEach((holiday, index) => newSelected.delete(getHolidayId(holiday, index)));
    } else {
      filteredHolidays.forEach((holiday, index) => newSelected.add(getHolidayId(holiday, index)));
    }

    setSelectedHolidays(newSelected);
  }, [filteredHolidays, selectedHolidays, selectionState.type, getHolidayId]);

  const toggleSelectHoliday = useCallback(
    (holiday: HolidayDTO, index: number) => {
      const holidayId = getHolidayId(holiday, index);
      const newSelected = new Set(selectedHolidays);

      if (newSelected.has(holidayId)) {
        newSelected.delete(holidayId);
      } else {
        newSelected.add(holidayId);
      }

      setSelectedHolidays(newSelected);
    },
    [selectedHolidays, getHolidayId]
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

  const SelectAllButton = useMemo(() => {
    const { type } = selectionState;

    const getLabel = () => {
      switch (type) {
        case 'none':
          return 'Seleccionar todos';
        case 'some':
          return 'Selección parcial - click para seleccionar todos';
        case 'all':
          return 'Deseleccionar todos';
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
  }, [selectionState, toggleSelectAll, premiumKey]);

  const selectedCount = selectedHolidays.size;
  const shouldShowLocationColumn = variantHolidays.some((h) => h.location);

  return (
    <Collapsible open={innerOpen} onOpenChange={setInnerOpen} className={'space-y-4 w-full'}>
                <CollapsibleTrigger asChild className='cursor-pointer'>
        <div className='flex items-center justify-between cursor-pointer group hover:bg-muted/50 p-3 rounded-lg border transition-colors'>
          <div className='flex items-center space-x-3'>
            <div className='flex items-center space-x-2'>
              {innerOpen ? (
                <ChevronDown className='h-4 w-4 text-muted-foreground transition-transform' />
              ) : (
                <ChevronRight className='h-4 w-4 text-muted-foreground transition-transform' />
              )}
              <h3 className='text-lg font-semibold'>{title}</h3>
            </div>
            <div className='flex items-center space-x-2'>
              <Badge variant='outline'>{variantHolidays.length} total</Badge>
            </div>
          </div>
          <div className='flex items-center space-x-2 text-sm text-muted-foreground'>
            <span>{variantHolidays.filter((h) => !isWeekend(h.date)).length} laborables</span>
            <span>•</span>
            <span>{variantHolidays.filter((h) => isWeekend(h.date)).length} fines de semana</span>
          </div>
        </div>
      </CollapsibleTrigger>
      {innerOpen && (
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            {variant === HolidayVariant.CUSTOM && (
              <Button
                size='sm'
                onClick={() => setShowAddModal(true)}
                className='bg-green-600 hover:bg-green-700 text-white'
              >
                <Plus className='h-4 w-4 mr-1' />
                Añadir Festivo
              </Button>
            )}
            {selectedCount === 1 && (
              <Button variant='outline' size='sm' onClick={() => setShowEditModal(true)} className='py-4'>
                <Edit className='h-4 w-4 mr-1' />
                Editar festivo
              </Button>
            )}
            {selectedCount > 0 && (
              <div className='flex items-center space-x-2'>
                <Button variant='destructive' size='sm' onClick={() => setShowDeleteModal(true)}>
                  <Trash2 className='h-4 w-4 mr-1' />
                  Eliminar {selectedCount} festivos
                </Button>
              </div>
            )}
          </div>
          <div className='relative'>
            <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Buscar festividad...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-8 w-64'
            />
          </div>
        </div>
      )}
      <CollapsibleContent className='space-y-4 overflow-hidden'>
        {innerOpen && (
          <div className='rounded-md border max-h-96 overflow-hidden'>
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
                    <TableRow>
                      <TableCell colSpan={shouldShowLocationColumn ? 7 : 6} className='h-24 text-center'>
                        <div className='flex flex-col items-center space-y-2 text-muted-foreground'>
                          <Search className='h-8 w-8' />
                          <span>{debouncedSearchTerm ? 'No se encontraron festividades' : 'No hay festividades'}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        <div className='flex items-center justify-between text-sm text-muted-foreground'>
          <div className='flex items-center space-x-4'>
            <span>En fin de semana: {variantHolidays.filter((h) => isWeekend(h.date)).length}</span>
            <span>En laborables: {variantHolidays.filter((h) => !isWeekend(h.date)).length}</span>
          </div>
          <div className='flex items-center space-x-2'>
            <span>
              Mostrando {filteredHolidays.length} de {variantHolidays.length}
            </span>
          </div>
        </div>
      </CollapsibleContent>
      <AddHolidayModal open={showAddModal} onClose={handleCloseAddModal} locale={locale} />
      {getSelectedHolidays().length === 1 && (
        <EditHolidayModal
          open={showEditModal}
          onClose={handleCloseEditModal}
          locale={locale}
          holiday={getSelectedHolidays()[0]}
        />
      )}
      <DeleteHolidayModal
        open={showDeleteModal}
        onClose={handleCloseDeleteModal}
        locale={locale}
        holidays={getSelectedHolidays()}
      />
    </Collapsible>
  );
};
