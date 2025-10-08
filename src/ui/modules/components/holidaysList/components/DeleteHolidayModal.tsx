'use client';

import type { HolidayDTO } from '@application/dto/holiday/types';
import { useHolidaysStore } from '@application/stores/holidays';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@const/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import type { Locale } from 'next-intl';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import { formatDate } from '../../utils/formatters';
import { Trash2 } from 'src/components/animate-ui/icons/trash-2';
import { AnimateIcon } from 'src/components/animate-ui/icons/icon';

interface DeleteHolidayModalProps {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  holidays: HolidayDTO[];
}

export const DeleteHolidayModal = ({ open, onClose, locale, holidays }: DeleteHolidayModalProps) => {
  const { removeHoliday } = useHolidaysStore();
  const [isPending, startTransition] = useTransition();
  const isMultiple = holidays.length > 1;
  const holidayText = isMultiple ? 'holidays' : 'holiday';

  const handleDelete = () => {
    startTransition(() => {
      try {
        holidays.forEach((holiday) => {
          removeHoliday(holiday.id);
        });

        toast.success(`${isMultiple ? 'Holidays' : 'Holiday'} deleted successfully`, {
          description: isMultiple
            ? `${holidays.length} holidays have been removed`
            : `${holidays[0].name} has been removed`,
        });

        onClose();
      } catch (error) {
        console.error('Error deleting holiday:', error);
        toast.error('Error deleting holiday', {
          description: 'Something went wrong. Please try again.',
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-destructive'>
            <AlertTriangle className='w-5 h-5' />
            Delete {holidayText}
          </DialogTitle>
          <DialogDescription asChild className='space-y-3'>
            <div>
              <span className='block my-2 '>
                Are you sure you want to delete {isMultiple ? 'these' : 'this'} {holidayText}? This action cannot be
                undone.
              </span>
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
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <div className='flex gap-2 pt-4'>
            <AnimateIcon animateOnHover>
              <Button variant='destructive' onClick={handleDelete} className='flex-1' disabled={isPending}>
                <Trash2 className='w-4 h-4 mr-2' />
                {isPending ? 'Deleting...' : `Delete ${holidays.length} ${holidayText}`}
              </Button>
            </AnimateIcon>
            <Button variant='outline' onClick={onClose} className='flex-1' disabled={isPending}>
              Cancel
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
