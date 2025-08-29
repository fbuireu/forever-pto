import { HolidayVariant } from '@application/dto/holiday/types';
import { TableHead, TableHeader, TableRow } from '@const/components/ui/table';
import { memo } from 'react';

interface HolidayTableHeaderProps {
  selectAllButton: React.ReactNode;
  shouldShowLocationColumn: boolean;
  variant: HolidayVariant;
}

export const HolidayTableHeader = memo<HolidayTableHeaderProps>(
  ({ selectAllButton, shouldShowLocationColumn, variant }) => (
    <TableHeader className='sticky top-0 bg-background z-10'>
      <TableRow>
        <TableHead>{selectAllButton}</TableHead>
        <TableHead>Festividad</TableHead>
        <TableHead>Fecha</TableHead>
        <TableHead>Día</TableHead>
        <TableHead>Tipo</TableHead>
        <TableHead>Estado</TableHead>
        {shouldShowLocationColumn && (
          <TableHead>{variant === HolidayVariant.REGIONAL ? 'Región' : 'Ubicación'}</TableHead>
        )}
      </TableRow>
    </TableHeader>
  )
);

HolidayTableHeader.displayName = 'HolidayTableHeader';
