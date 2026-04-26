import type { HolidayDTO } from '@application/dto/holiday/types';
import { ArrowDown } from '@ui/modules/core/animate/icons/ArrowDown';
import { ArrowUp } from '@ui/modules/core/animate/icons/ArrowUp';
import { AnimateIcon } from '@ui/modules/core/animate/icons/Icon';
import { TableHeader as BaseTableHeader, TableHead, TableRow } from '@ui/modules/core/primitives/Table';
import { cn } from '@ui/utils/utils';
import { ArrowUpDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { memo } from 'react';

interface HolidayTableHeaderProps {
  selectAllButton: React.ReactNode;
  sortConfig: {
    key: keyof HolidayDTO | null;
    direction: 'asc' | 'desc';
  };
  onSort: (key: keyof HolidayDTO) => void;
}

interface TableHeaderProps {
  children: React.ReactNode;
  sortKey: keyof HolidayDTO;
  currentSort: { key: keyof HolidayDTO | null; direction: 'asc' | 'desc' };
  onSort: (key: keyof HolidayDTO) => void;
  className?: string;
}

const TableHeader = ({ children, sortKey, currentSort, onSort, className = '' }: TableHeaderProps) => {
  const isActive = currentSort.key === sortKey;
  const Icon = isActive ? (currentSort.direction === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <TableHead
      className={cn('cursor-pointer select-none hover:bg-muted/50 transition-colors', className)}
      onClick={() => onSort(sortKey)}
    >
      <AnimateIcon animateOnHover>
        <div className='flex items-center space-x-1 text-foreground'>
          <span>{children}</span>
          <Icon className='h-4 w-4' />
        </div>
      </AnimateIcon>
    </TableHead>
  );
};

const HolidayTableHeaderComponent = ({ selectAllButton, sortConfig, onSort }: HolidayTableHeaderProps) => {
  const t = useTranslations('holidayTableHeader');

  return (
    <BaseTableHeader className='sticky top-0 z-10'>
      <TableRow>
        <TableHead>{selectAllButton}</TableHead>
        <TableHeader sortKey='name' currentSort={sortConfig} onSort={onSort}>
          {t('holiday')}
        </TableHeader>
        <TableHeader sortKey='date' currentSort={sortConfig} onSort={onSort}>
          {t('date')}
        </TableHeader>
        <TableHead className='text-foreground'>{t('day')}</TableHead>
        <TableHeader sortKey='type' currentSort={sortConfig} onSort={onSort}>
          {t('type')}
        </TableHeader>
        <TableHead className='text-foreground'>{t('status')}</TableHead>
      </TableRow>
    </BaseTableHeader>
  );
};

export const HolidayTableHeader = memo(HolidayTableHeaderComponent);
HolidayTableHeader.displayName = 'HolidayTableHeader';
