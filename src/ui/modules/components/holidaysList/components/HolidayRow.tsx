import { type HolidayDTO } from '@application/dto/holiday/types';
import { Badge } from '@const/components/ui/badge';
import { TableCell, TableRow } from '@const/components/ui/table';
import { cn } from '@const/lib/utils';
import { isWeekend } from 'date-fns/isWeekend';
import type { Locale } from 'next-intl';
import { memo } from 'react';
import { Checkbox } from 'src/components/animate-ui/base/checkbox';
import { PremiumFeature, PremiumFeatureVariant } from '../../premium/PremiumFeature';
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
      variant: isWeekendDay ? ('destructive' as const) : ('default' as const),
      text: isWeekendDay ? 'Fin de semana' : 'Laborable',
      className: cn(!isWeekendDay && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'),
    };
  };

  const workdayStatus = getWorkdayStatus(holiday.date);

  return (
    <TableRow className={cn('hover:bg-muted/50', isSelected && 'bg-muted/25')}>
      <TableCell>
        <PremiumFeature
          feature='Edit Holidays'
          variant={PremiumFeatureVariant.STACK}
          iconSize='h-4 w-4'
          className='bg-none'
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggle(holiday, index)}
            aria-label={`Seleccionar ${holiday.name}`}
          />
        </PremiumFeature>
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
        <Badge variant='outline' className='capitalize text-xs'>
          {holiday.type ?? holiday.variant}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={workdayStatus.variant} className={cn('text-xs', workdayStatus.className)}>
          {workdayStatus.isWorkday ? 'Laborable' : 'Weekend'}
        </Badge>
      </TableCell>
    </TableRow>
  );
});

HolidayRow.displayName = 'HolidayRow';
