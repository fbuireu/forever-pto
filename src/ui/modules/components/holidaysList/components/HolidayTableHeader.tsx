import { type HolidayDTO, HolidayVariant } from '@application/dto/holiday/types';
import { TableHead, TableHeader, TableRow } from '@const/components/ui/table';
import { cn } from '@const/lib/utils';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { memo } from 'react';

interface HolidayTableHeaderProps {
  selectAllButton: React.ReactNode;
  shouldShowLocationColumn: boolean;
  variant: HolidayVariant;
  sortConfig: {
    key: keyof HolidayDTO | null;
    direction: 'asc' | 'desc';
  };
  onSort: (key: keyof HolidayDTO) => void;
}

const SortableHeader = ({
  children,
  sortKey,
  currentSort,
  onSort,
  className = '',
}: {
  children: React.ReactNode;
  sortKey: keyof HolidayDTO;
  currentSort: { key: keyof HolidayDTO | null; direction: 'asc' | 'desc' };
  onSort: (key: keyof HolidayDTO) => void;
  className?: string;
}) => {
  const isActive = currentSort.key === sortKey;
  const Icon = isActive ? (currentSort.direction === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <TableHead
      className={cn('cursor-pointer select-none hover:bg-muted/50 transition-colors', className)}
      onClick={() => onSort(sortKey)}
    >
      <div className='flex items-center space-x-1'>
        <span>{children}</span>
        <Icon className='h-4 w-4' />
      </div>
    </TableHead>
  );
};

export const HolidayTableHeader = memo<HolidayTableHeaderProps>(
  ({ selectAllButton, shouldShowLocationColumn, variant, sortConfig, onSort }) => (
    <TableHeader className='sticky top-0 bg-background z-10'>
      <TableRow>
        <TableHead>{selectAllButton}</TableHead>
        <SortableHeader sortKey='name' currentSort={sortConfig} onSort={onSort}>
          Festividad
        </SortableHeader>
        <SortableHeader sortKey='date' currentSort={sortConfig} onSort={onSort}>
          Fecha
        </SortableHeader>
        <TableHead>Día</TableHead>
        <SortableHeader sortKey='type' currentSort={sortConfig} onSort={onSort}>
          Tipo
        </SortableHeader>
        <TableHead>Estado</TableHead>
        {shouldShowLocationColumn && (
          <SortableHeader sortKey='location' currentSort={sortConfig} onSort={onSort}>
            {variant === HolidayVariant.REGIONAL ? 'Región' : 'Ubicación'}
          </SortableHeader>
        )}
      </TableRow>
    </TableHeader>
  )
);

HolidayTableHeader.displayName = 'HolidayTableHeader';
