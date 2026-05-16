import { Button } from '@ui/modules/core/primitives/Button';
import { cn } from '@ui/utils/cn';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useFormStatus } from 'react-dom';

interface FormButtonsProps {
  onCancel?: () => void;
  submitText?: string;
  loadingText?: string;
  cancelText?: string;
  hideCancel?: boolean;
  submitClassName?: string;
  cancelClassName?: string;
  submitVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success';
  pending?: boolean;
}

export const FormButtons = ({
  onCancel,
  submitText,
  loadingText,
  cancelText,
  hideCancel = false,
  submitClassName,
  cancelClassName,
  submitVariant = 'success',
  pending: pendingProp,
}: FormButtonsProps) => {
  const t = useTranslations('formButtons');
  const resolvedSubmitText = submitText ?? t('submit');
  const resolvedLoadingText = loadingText ?? t('processing');
  const resolvedCancelText = cancelText ?? t('cancel');
  const { pending: pendingStatus } = useFormStatus();
  const isPending = pendingProp ?? pendingStatus;

  return (
    <div className='flex gap-2 pt-2'>
      <Button type='submit' disabled={isPending} className={cn(submitClassName ?? 'flex-1')} variant={submitVariant}>
        {isPending ? (
          <>
            <Loader2 className='size-4 mr-2 animate-spin' />
            {resolvedLoadingText}
          </>
        ) : (
          resolvedSubmitText
        )}
      </Button>
      {!hideCancel && onCancel && (
        <Button type='button' variant='destructive' onClick={onCancel} disabled={isPending} className={cancelClassName}>
          {resolvedCancelText}
        </Button>
      )}
    </div>
  );
};
