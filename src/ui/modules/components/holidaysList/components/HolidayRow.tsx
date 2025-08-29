import { type HolidayDTO, HolidayVariant } from '@application/dto/holiday/types';
import { Badge } from '@const/components/ui/badge';
import { TableCell, TableRow } from '@const/components/ui/table';
import { isWeekend } from 'date-fns/isWeekend';
import { memo } from 'react';
import { Checkbox } from 'src/components/animate-ui/base/checkbox';
import { formatDate } from '../../utils/formatters';
import type { Locale } from 'next-intl';

interface HolidayRowProps {
  holiday: HolidayDTO;
  index: number;
  isSelected: boolean;
  shouldShowLocationColumn: boolean;
  variant: HolidayVariant;
  locale: Locale;
  onToggle: (holiday: HolidayDTO, index: number) => void;
}

export const HolidayRow = memo<HolidayRowProps>(
  ({ holiday, index, isSelected, shouldShowLocationColumn, variant, locale, onToggle }) => {
    const getWorkdayStatus = (date: Date) => {
      const isWeekendDay = isWeekend(date);
      return {
        isWorkday: !isWeekendDay,
        variant: isWeekendDay ? ('secondary' as const) : ('destructive' as const),
        text: isWeekendDay ? 'Fin de semana' : 'Laborable',
      };
    };

    const workdayStatus = getWorkdayStatus(holiday.date);

    return (
      <TableRow className={`hover:bg-muted/50 ${isSelected ? 'bg-muted/25' : ''}`}>
        <TableCell>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggle(holiday, index)}
            aria-label={`Seleccionar ${holiday.name}`}
          />
        </TableCell>
        <TableCell className='font-medium'>
          <div className='flex items-center space-x-2'>
            <span className='truncate'>{holiday.name}</span>
          </div>
        </TableCell>
        <TableCell>
          <span className='font-mono text-sm'>{formatDate({ date: holiday.date, locale, format: 'yyyy-MM-dd' })}</span>
        </TableCell>
        <TableCell>
          <span className='capitalize text-sm text-muted-foreground truncate'>
            {formatDate({ date: holiday.date, locale, format: 'EEEE' })}
          </span>
        </TableCell>
        <TableCell>
          {holiday.type ? (
            <Badge variant='outline' className='capitalize text-xs'>
              {holiday.type}
            </Badge>
          ) : (
            <span className='text-muted-foreground text-sm'>-</span>
          )}
        </TableCell>
        <TableCell>
          <Badge variant={workdayStatus.variant} className='text-xs'>
            {workdayStatus.isWorkday ? 'Lab.' : 'F.S.'}
          </Badge>
        </TableCell>
        {shouldShowLocationColumn && (
          <TableCell className='text-sm text-muted-foreground'>
            <span className='truncate'>
              {holiday.location ?? (variant === HolidayVariant.NATIONAL ? 'Nacional' : '-')}
            </span>
          </TableCell>
        )}
      </TableRow>
    );
  }
);

HolidayRow.displayName = 'HolidayRow';
