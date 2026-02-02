import { type HolidayDTO, HolidayVariant } from '@application/dto/holiday/types';
import { TableHeader as BaseTableHeader, TableHead, TableRow } from '@const/components/ui/table';
import { cn } from '@const/lib/utils';
import { ArrowUpDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { memo } from 'react';
import { ArrowUp } from 'src/components/animate-ui/icons/arrow-up';
import { ArrowDown } from 'src/components/animate-ui/icons/arrow-down';
import { AnimateIcon } from 'src/components/animate-ui/icons/icon';

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
        <div className='flex items-center space-x-1'>
          <span>{children}</span>
          <Icon className='h-4 w-4' />
        </div>
      </AnimateIcon>
    </TableHead>
  );
};

const HolidayTableHeaderComponent = ({
  selectAllButton,
  shouldShowLocationColumn,
  variant,
  sortConfig,
  onSort,
}: HolidayTableHeaderProps) => {
  const t = useTranslations('holidayTableHeader');

  return (
    <BaseTableHeader className='sticky top-0 bg-background z-10'>
      <TableRow>
        <TableHead>{selectAllButton}</TableHead>
        <TableHeader sortKey='name' currentSort={sortConfig} onSort={onSort}>
          {t('holiday')}
        </TableHeader>
        <TableHeader sortKey='date' currentSort={sortConfig} onSort={onSort}>
          {t('date')}
        </TableHeader>
        <TableHead>{t('day')}</TableHead>
        <TableHeader sortKey='type' currentSort={sortConfig} onSort={onSort}>
          {t('type')}
        </TableHeader>
        <TableHead>{t('status')}</TableHead>
        {shouldShowLocationColumn && (
          <TableHeader sortKey='location' currentSort={sortConfig} onSort={onSort}>
            {variant === HolidayVariant.REGIONAL ? t('region') : t('location')}
          </TableHeader>
        )}
      </TableRow>
    </BaseTableHeader>
  );
};

export const HolidayTableHeader = memo(HolidayTableHeaderComponent);
HolidayTableHeader.displayName = 'HolidayTableHeader';
