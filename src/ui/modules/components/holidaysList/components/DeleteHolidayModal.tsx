'use client';

import type { HolidayDTO } from '@application/dto/holiday/types';
import { useHolidaysStore } from '@application/stores/holidays';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@const/components/ui/dialog';
import { AlertTriangle, Trash2 } from 'lucide-react';
import type { Locale } from 'next-intl';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import { formatDate } from '../../utils/formatters';

interface DeleteHolidayModalProps {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  holidays: HolidayDTO[];
}

export const DeleteHolidayModal = ({ open, onClose, locale, holidays }: DeleteHolidayModalProps) => {
  const { removeHoliday } = useHolidaysStore();

  const handleDelete = () => {
    holidays.forEach((holiday) => {
      removeHoliday(holiday.id);
    });

    onClose();
  };

  const isMultiple = holidays.length > 1;
  const holidayText = isMultiple ? 'holidays' : 'holiday';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-destructive'>
            <AlertTriangle className='w-5 h-5' />
            Delete {holidayText}
          </DialogTitle>
          <DialogDescription className='space-y-3'>
            <p>
              Are you sure you want to delete {isMultiple ? 'these' : 'this'} {holidayText}? This action cannot be
              undone.
            </p>

            <div className='bg-muted rounded-lg p-3 max-h-32 overflow-y-auto'>
              <div className='space-y-2'>
                {holidays.map((holiday) => (
                  <div key={holiday.id} className='flex items-center justify-between text-sm'>
                    <span className='font-medium'>{holiday.name}</span>
                    <span className='text-muted-foreground'>
                      {formatDate({ date: holiday.date, locale, format: 'MMM d, yyyy' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className='flex gap-2 pt-4'>
          <Button variant='destructive' onClick={handleDelete} className='flex-1'>
            <Trash2 className='w-4 h-4 mr-2' />
            Delete {holidays.length} {holidayText}
          </Button>
          <Button variant='outline' onClick={onClose} className='flex-1'>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
