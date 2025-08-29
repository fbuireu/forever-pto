'use client';

import { HolidayVariant } from '@application/dto/holiday/types';
import { useHolidaysStore } from '@application/stores/holidays';
import { Badge } from '@const/components/ui/badge';
import { Button } from '@const/components/ui/button';
import { Input } from '@const/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@const/components/ui/table';
import { format, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Download,
  Globe,
  MapPin,
  Minus,
  Search,
  Square,
  Trash2,
  User,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Checkbox } from 'src/components/animate-ui/base/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from 'src/components/animate-ui/radix/collapsible';

interface HolidaysTableProps {
  variant: HolidayVariant;
  onExport?: (selectedHolidays: any[]) => void;
  onDelete?: (selectedHolidays: any[]) => void;
  defaultOpen?: boolean;
}

// Configuración para cada tipo de holiday
const VARIANT_CONFIG = {
  [HolidayVariant.NATIONAL]: {
    title: 'Fiestas Nacionales',
    icon: Globe,
    searchPlaceholder: 'Buscar festividad nacional...',
    emptyMessage: 'No hay festividades nacionales disponibles',
    noResultsMessage: 'No se encontraron festividades nacionales',
  },
  [HolidayVariant.REGIONAL]: {
    title: 'Fiestas Regionales',
    icon: MapPin,
    searchPlaceholder: 'Buscar por región o festividad...',
    emptyMessage: 'No hay festividades regionales disponibles',
    noResultsMessage: 'No se encontraron festividades regionales',
  },
  [HolidayVariant.CUSTOM]: {
    title: 'Fiestas Personalizadas',
    icon: User,
    searchPlaceholder: 'Buscar festividad personalizada...',
    emptyMessage: 'No hay festividades personalizadas configuradas',
    noResultsMessage: 'No se encontraron festividades personalizadas',
  },
} as const;

export const HolidaysTable = ({ variant, onExport, onDelete, defaultOpen = false }: HolidaysTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHolidays, setSelectedHolidays] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { holidays } = useHolidaysStore();

  const config = VARIANT_CONFIG[variant];
  const IconComponent = config.icon;

  // Filtrar holidays por variante y convertir fechas string a Date
  const filteredByVariant = useMemo(
    () =>
      holidays
        .filter((holiday) => holiday.variant === variant)
        .map((holiday) => ({
          ...holiday,
          date: typeof holiday.date === 'string' ? new Date(holiday.date) : holiday.date,
        })),
    [holidays, variant]
  );

  // Filtrar holidays por término de búsqueda
  const filteredHolidays = useMemo(
    () =>
      filteredByVariant.filter(
        (holiday) =>
          holiday.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          holiday.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          holiday.location?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [filteredByVariant, searchTerm]
  );

  // Ordenar por fecha
  const sortedHolidays = useMemo(
    () => filteredHolidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [filteredHolidays]
  );

  // Generar ID único para cada holiday
  const getHolidayId = useCallback((holiday: any, index: number) => {
    return `${holiday.name}-${holiday.date.getTime()}-${index}`;
  }, []);

  // Estados de selección
  const selectionState = useMemo(() => {
    if (sortedHolidays.length === 0) {
      return { type: 'none' as const, count: 0 };
    }

    const selectedCount = sortedHolidays.filter((holiday, index) =>
      selectedHolidays.has(getHolidayId(holiday, index))
    ).length;

    if (selectedCount === 0) {
      return { type: 'none' as const, count: 0 };
    } else if (selectedCount === sortedHolidays.length) {
      return { type: 'all' as const, count: selectedCount };
    } else {
      return { type: 'some' as const, count: selectedCount };
    }
  }, [sortedHolidays, selectedHolidays, getHolidayId]);

  // Seleccionar/deseleccionar todos los holidays visibles
  const toggleSelectAll = useCallback(() => {
    const newSelected = new Set(selectedHolidays);

    if (selectionState.type === 'all') {
      // Deseleccionar todos los visibles
      sortedHolidays.forEach((holiday, index) => {
        newSelected.delete(getHolidayId(holiday, index));
      });
    } else {
      // Seleccionar todos los visibles
      sortedHolidays.forEach((holiday, index) => {
        newSelected.add(getHolidayId(holiday, index));
      });
    }

    setSelectedHolidays(newSelected);
  }, [sortedHolidays, selectedHolidays, selectionState.type, getHolidayId]);

  // Seleccionar/deseleccionar un holiday individual
  const toggleSelectHoliday = useCallback(
    (holiday: any, index: number) => {
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

  // Limpiar selección
  const clearSelection = useCallback(() => {
    setSelectedHolidays(new Set());
  }, []);

  // Obtener holidays seleccionados
  const getSelectedHolidays = useCallback(() => {
    return sortedHolidays.filter((holiday, index) => selectedHolidays.has(getHolidayId(holiday, index)));
  }, [sortedHolidays, selectedHolidays, getHolidayId]);

  // Manejar exportación
  const handleExport = useCallback(() => {
    const selected = getSelectedHolidays();
    if (onExport) {
      onExport(selected);
    } else {
      console.log(`${config.title} seleccionados:`, selected);
    }
  }, [getSelectedHolidays, onExport, config.title]);

  // Manejar eliminación
  const handleDelete = useCallback(() => {
    const selected = getSelectedHolidays();
    if (onDelete) {
      onDelete(selected);
    } else {
      console.log(`Eliminar ${config.title}:`, selected);
      // Por defecto, limpiar selección después de "eliminar"
      clearSelection();
    }
  }, [getSelectedHolidays, onDelete, config.title, clearSelection]);

  const formatDate = (date: Date) => {
    return format(date, 'dd MMM yyyy', { locale: es });
  };

  const getDayOfWeek = (date: Date) => {
    return format(date, 'EEEE', { locale: es });
  };

  const getWorkdayStatus = (date: Date) => {
    const isWeekendDay = isWeekend(date);
    return {
      isWorkday: !isWeekendDay,
      variant: isWeekendDay ? ('secondary' as const) : ('destructive' as const),
      text: isWeekendDay ? 'Fin de semana' : 'Laborable',
    };
  };

  const getTypeIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'public':
        return '🏛️';
      case 'observance':
        return '👁️';
      case 'religious':
        return '⛪';
      case 'civil':
        return '🎗️';
      default:
        return '📅';
    }
  };

  const getVariantIcon = (variant: string) => {
    switch (variant) {
      case 'national':
        return <Globe className='h-4 w-4' />;
      case 'regional':
        return <MapPin className='h-4 w-4' />;
      case 'custom':
        return <User className='h-4 w-4' />;
      default:
        return <Calendar className='h-4 w-4' />;
    }
  };

  // Componente elegante para el selector principal
  const SelectAllButton = () => {
    const { type } = selectionState;

    const getIcon = () => {
      switch (type) {
        case 'none':
          return <Square className='h-4 w-4' />;
        case 'some':
          return <Minus className='h-4 w-4' />;
        case 'all':
          return <CheckSquare className='h-4 w-4' />;
      }
    };

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
      <Button
        variant='ghost'
        size='sm'
        className='h-6 w-6 p-0 hover:bg-muted'
        onClick={toggleSelectAll}
        aria-label={getLabel()}
        title={getLabel()}
      >
        {getIcon()}
      </Button>
    );
  };

  const selectedCount = selectedHolidays.size;
  const shouldShowLocationColumn = filteredByVariant.some((h) => h.location);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className='space-y-4'>
      {/* Header colapsable */}
      <CollapsibleTrigger asChild>
        <div className='flex items-center justify-between cursor-pointer group hover:bg-muted/50 p-3 rounded-lg border transition-colors'>
          <div className='flex items-center space-x-3'>
            <div className='flex items-center space-x-2'>
              {isOpen ? (
                <ChevronDown className='h-4 w-4 text-muted-foreground transition-transform' />
              ) : (
                <ChevronRight className='h-4 w-4 text-muted-foreground transition-transform' />
              )}
              <IconComponent className='h-5 w-5 text-muted-foreground' />
              <h3 className='text-lg font-semibold'>{config.title}</h3>
            </div>
            <div className='flex items-center space-x-2'>
              <Badge variant='outline'>{filteredByVariant.length} total</Badge>
              {sortedHolidays.length !== filteredByVariant.length && (
                <Badge variant='secondary'>{sortedHolidays.length} filtrados</Badge>
              )}
              {selectedCount > 0 && <Badge variant='destructive'>{selectedCount} seleccionados</Badge>}
            </div>
          </div>

          <div className='flex items-center space-x-2 text-sm text-muted-foreground'>
            <span>{filteredByVariant.filter((h) => !isWeekend(h.date)).length} laborables</span>
            <span>•</span>
            <span>{filteredByVariant.filter((h) => isWeekend(h.date)).length} fines de semana</span>
          </div>
        </div>
      </CollapsibleTrigger>

      {/* Controles fuera del collapsible para evitar animaciones extrañas */}
      {isOpen && (
        <div className='flex items-center justify-between px-3'>
          <div className='flex items-center space-x-2'>
            {/* Acciones para elementos seleccionados */}
            {selectedCount > 0 && (
              <div className='flex items-center space-x-2'>
                <Button variant='outline' size='sm' onClick={handleExport}>
                  <Download className='h-4 w-4 mr-1' />
                  Exportar ({selectedCount})
                </Button>
                {variant === HolidayVariant.CUSTOM && (
                  <Button variant='outline' size='sm' onClick={handleDelete}>
                    <Trash2 className='h-4 w-4 mr-1' />
                    Eliminar
                  </Button>
                )}
                <Button variant='outline' size='sm' onClick={clearSelection}>
                  <Trash2 className='h-4 w-4 mr-1' />
                  Limpiar
                </Button>
              </div>
            )}
          </div>

          <div className='relative'>
            <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder={config.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-8 w-64'
            />
          </div>
        </div>
      )}

      {/* Contenido colapsable - toda la tabla */}
      <CollapsibleContent className='space-y-4'>
        {/* Header de tabla dentro del collapsible */}
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[50px]'>
                  <SelectAllButton />
                </TableHead>
                <TableHead className='w-[300px]'>Festividad</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Día</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                {/* Solo mostrar ubicación si hay holidays con location */}
                {shouldShowLocationColumn && (
                  <TableHead>{variant === HolidayVariant.REGIONAL ? 'Región' : 'Ubicación'}</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedHolidays.length > 0 ? (
                sortedHolidays.map((holiday, index) => {
                  const workdayStatus = getWorkdayStatus(holiday.date);
                  const holidayId = getHolidayId(holiday, index);
                  const isSelected = selectedHolidays.has(holidayId);

                  return (
                    <TableRow key={holidayId} className={`hover:bg-muted/50 ${isSelected ? 'bg-muted/25' : ''}`}>
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectHoliday(holiday, index)}
                          aria-label={`Seleccionar ${holiday.name}`}
                        />
                      </TableCell>
                      <TableCell className='font-medium'>
                        <div className='flex items-center space-x-2'>
                          {getVariantIcon(holiday.variant)}
                          <span>{holiday.name}</span>
                          {holiday.type && (
                            <span className='text-lg' title={holiday.type}>
                              {getTypeIcon(holiday.type)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className='font-mono text-sm'>{formatDate(holiday.date)}</span>
                      </TableCell>
                      <TableCell>
                        <span className='capitalize text-sm text-muted-foreground'>{getDayOfWeek(holiday.date)}</span>
                      </TableCell>
                      <TableCell>
                        {holiday.type ? (
                          <Badge variant='outline' className='capitalize'>
                            {holiday.type}
                          </Badge>
                        ) : (
                          <span className='text-muted-foreground text-sm'>Sin tipo</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={workdayStatus.variant}>{workdayStatus.text}</Badge>
                      </TableCell>
                      {/* Solo mostrar columna de ubicación si hay holidays con location */}
                      {shouldShowLocationColumn && (
                        <TableCell className='text-sm text-muted-foreground'>
                          {holiday.location || (variant === HolidayVariant.NATIONAL ? 'Nacional' : 'Sin especificar')}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={shouldShowLocationColumn ? 7 : 6} className='h-24 text-center'>
                    <div className='flex flex-col items-center space-y-2 text-muted-foreground'>
                      <Search className='h-8 w-8' />
                      <span>{searchTerm ? config.noResultsMessage : config.emptyMessage}</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer con estadísticas */}
        <div className='flex items-center justify-between text-sm text-muted-foreground border-t pt-3'>
          <div className='flex items-center space-x-4'>
            <span>Total: {filteredByVariant.length} festividades</span>
            <span>En fin de semana: {filteredByVariant.filter((h) => isWeekend(h.date)).length}</span>
            <span>En laborables: {filteredByVariant.filter((h) => !isWeekend(h.date)).length}</span>
            {selectedCount > 0 && (
              <span className='font-medium text-foreground'>
                {selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className='flex items-center space-x-2'>
            <span>
              Mostrando {sortedHolidays.length} de {filteredByVariant.length}
            </span>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
