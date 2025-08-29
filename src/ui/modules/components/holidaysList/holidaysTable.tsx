'use client';

import { type HolidayDTO, HolidayVariant } from '@application/dto/holiday/types';
import { useHolidaysStore } from '@application/stores/holidays';
import { Badge } from '@const/components/ui/badge';
import { Button } from '@const/components/ui/button';
import { Input } from '@const/components/ui/input';
import { Table, TableBody, TableCell, TableRow } from '@const/components/ui/table';
import { useDebounce } from '@ui/hooks/useDebounce';
import { isWeekend } from 'date-fns/isWeekend';
import { ChevronDown, ChevronRight, Search, Trash2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { Checkbox } from 'src/components/animate-ui/base/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from 'src/components/animate-ui/radix/collapsible';
import { HolidayRow } from './components/HolidayRow';
import { HolidayTableHeader } from './components/HolidayTableHeader';
interface HolidaysTableProps {
  variant: HolidayVariant;
  onDelete: (selectedHolidays: HolidayDTO[]) => void;
  defaultOpen?: boolean;
}

const CONFIG = {
  [HolidayVariant.NATIONAL]: {
    title: 'Fiestas Nacionales',
  },
  [HolidayVariant.REGIONAL]: {
    title: 'Fiestas Regionales',
  },
  [HolidayVariant.CUSTOM]: {
    title: 'Fiestas Personalizadas',
  },
} as const;

export const HolidaysTable = ({ variant, onDelete, defaultOpen = false }: HolidaysTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const locale = useLocale();
  const [selectedHolidays, setSelectedHolidays] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [debouncedSearchTerm] = useDebounce({
    value: searchTerm,
    delay: 100,
  });
  const { holidays } = useHolidaysStore();

  const filteredByVariant = useMemo(
    () => holidays.filter((holiday) => holiday.variant === variant),
    [variant, holidays]
  );

  const filteredHolidays = useMemo(
    () =>
      filteredByVariant.filter(
        (holiday) =>
          holiday.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ??
          holiday.type?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ??
          holiday.location?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      ),
    [filteredByVariant, debouncedSearchTerm]
  );

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

  const getSelectedHolidays = useCallback(() => {
    return filteredHolidays.filter((holiday, index) => selectedHolidays.has(getHolidayId(holiday, index)));
  }, [filteredHolidays, selectedHolidays, getHolidayId]);

  const handleDelete = useCallback(() => {
    const selected = getSelectedHolidays();
    onDelete(selected);
  }, [getSelectedHolidays, onDelete]);

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
      <Checkbox
        checked={type === 'all'}
        indeterminate={type === 'some'}
        onCheckedChange={toggleSelectAll}
        aria-label={getLabel()}
        title={getLabel()}
      />
    );
  }, [selectionState, toggleSelectAll]);

  const selectedCount = selectedHolidays.size;
  const shouldShowLocationColumn = filteredByVariant.some((h) => h.location);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className='space-y-4'>
      <CollapsibleTrigger asChild>
        <div className='flex items-center justify-between cursor-pointer group hover:bg-muted/50 p-3 rounded-lg border transition-colors'>
          <div className='flex items-center space-x-3'>
            <div className='flex items-center space-x-2'>
              {isOpen ? (
                <ChevronDown className='h-4 w-4 text-muted-foreground transition-transform' />
              ) : (
                <ChevronRight className='h-4 w-4 text-muted-foreground transition-transform' />
              )}
              <h3 className='text-lg font-semibold'>{CONFIG[variant].title}</h3>
            </div>
            <div className='flex items-center space-x-2'>
              <Badge variant='outline'>{filteredByVariant.length} total</Badge>
            </div>
          </div>
          <div className='flex items-center space-x-2 text-sm text-muted-foreground'>
            <span>{filteredByVariant.filter((h) => !isWeekend(h.date)).length} laborables</span>
            <span>•</span>
            <span>{filteredByVariant.filter((h) => isWeekend(h.date)).length} fines de semana</span>
          </div>
        </div>
      </CollapsibleTrigger>
      {isOpen && (
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            {selectedCount > 0 && (
              <div className='flex items-center space-x-2'>
                <Button variant='destructive' size='sm' onClick={() => {}}>
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
      {isOpen && (
        <div className='rounded-md border m-0'>
          <Table>
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
            />
          </Table>
        </div>
      )}
      <CollapsibleContent className='space-y-4'>
        <div className='rounded-md border border-t-0 max-h-96 overflow-y-auto'>
          <Table>
            <colgroup>
              <col className='w-[50px]' />
              <col className='w-[300px]' />
              <col className='w-[120px]' />
              <col className='w-[100px]' />
              <col className='w-[80px]' />
              <col className='w-[100px]' />
              {shouldShowLocationColumn && <col className='w-[150px]' />}
            </colgroup>
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
                      shouldShowLocationColumn={shouldShowLocationColumn}
                      variant={variant}
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
        <div className='flex items-center justify-between text-sm text-muted-foreground border-t pt-3'>
          <div className='flex items-center space-x-4'>
            <span>En fin de semana: {filteredByVariant.filter((h) => isWeekend(h.date)).length}</span>
            <span>En laborables: {filteredByVariant.filter((h) => !isWeekend(h.date)).length}</span>
          </div>
          <div className='flex items-center space-x-2'>
            <span>
              Mostrando {filteredHolidays.length} de {filteredByVariant.length}
            </span>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
