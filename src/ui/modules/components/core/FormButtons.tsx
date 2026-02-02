import { cn } from '@const/lib/utils';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useFormStatus } from 'react-dom';
import { Button } from 'src/components/animate-ui/components/buttons/button';

interface FormButtonsProps {
  onCancel?: () => void;
  submitText?: string;
  loadingText?: string;
  cancelText?: string;
  hideCancel?: boolean;
  submitClassName?: string;
  cancelClassName?: string;
  submitVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
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
  submitVariant = 'default',
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
            <Loader2 className='w-4 h-4 mr-2 animate-spin' />
            {resolvedLoadingText}
          </>
        ) : (
          resolvedSubmitText
        )}
      </Button>
      {!hideCancel && onCancel && (
        <Button type='button' variant='outline' onClick={onCancel} disabled={isPending} className={cancelClassName}>
          {resolvedCancelText}
        </Button>
      )}
    </div>
  );
};
