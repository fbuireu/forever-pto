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
import { useTranslations } from 'next-intl';
import type { Locale } from 'next-intl';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import { formatDate } from '../../utils/formatters';
import { Trash2 } from 'src/components/animate-ui/icons/trash-2';
import { AnimateIcon } from 'src/components/animate-ui/icons/icon';
import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';

interface DeleteHolidayModalProps {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  holidays: HolidayDTO[];
}

export const DeleteHolidayModal = ({ open, onClose, locale, holidays }: DeleteHolidayModalProps) => {
  const t = useTranslations('modals.deleteHoliday');
  const { removeHoliday } = useHolidaysStore();
  const [isPending, startTransition] = useTransition();
  const isMultiple = holidays.length > 1;

  const handleDelete = () => {
    startTransition(() => {
      try {
        holidays.forEach((holiday) => {
          removeHoliday(holiday.id);
        });

        toast.success(isMultiple ? t('successTitle') : t('successTitleSingular'), {
          description: isMultiple
            ? t('successDescription', { count: holidays.length })
            : t('successDescriptionSingular'),
        });

        onClose();
      } catch (error) {
        getBetterStackInstance().logError('Error deleting holiday', error, { component: 'DeleteHolidayModal' });
        toast.error(t('errorTitle'), {
          description: t('errorDescription'),
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
            {isMultiple ? t('title') : t('titleSingular')}
          </DialogTitle>
          <DialogDescription asChild className='space-y-3'>
            <div>
              <span className='block my-2 '>
                {isMultiple ? t('description', { count: holidays.length }) : t('descriptionSingular')}
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
                {isPending ? t('submitting') : t('submit')}
              </Button>
            </AnimateIcon>
            <Button variant='outline' onClick={onClose} className='flex-1' disabled={isPending}>
              {t('cancel')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
