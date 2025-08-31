import { type HolidayDTO } from '@application/dto/holiday/types';
import { Badge } from '@const/components/ui/badge';
import { TableCell, TableRow } from '@const/components/ui/table';
import { cn } from '@const/lib/utils';
import { isWeekend } from 'date-fns/isWeekend';
import type { Locale } from 'next-intl';
import { memo } from 'react';
import { Checkbox } from 'src/components/animate-ui/base/checkbox';
import { formatDate } from '../../utils/formatters';

interface HolidayRowProps {
  holiday: HolidayDTO;
  index: number;
  isSelected: boolean;
  locale: Locale;
  onToggle: (holiday: HolidayDTO, index: number) => void;
}

export const HolidayRow = memo<HolidayRowProps>(({ holiday, index, isSelected, locale, onToggle }) => {
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
    <TableRow className={cn('hover:bg-muted/50', isSelected && 'bg-muted/25')}>
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
          {workdayStatus.isWorkday ? 'Laborable' : 'Weekend'}
        </Badge>
      </TableCell>
    </TableRow>
  );
});

HolidayRow.displayName = 'HolidayRow';
