import { cn } from '@const/lib/utils';
import { Loader2 } from 'lucide-react';
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
  submitText = 'Submit',
  loadingText = 'Processing...',
  cancelText = 'Cancel',
  hideCancel = false,
  submitClassName,
  cancelClassName,
  submitVariant = 'default',
  pending: pendingProp,
}: FormButtonsProps) => {
  const { pending: pendingStatus } = useFormStatus();
  const pending = pendingProp ?? pendingStatus;

  return (
    <div className='flex gap-2 pt-2'>
      <Button type='submit' disabled={pending} className={cn(submitClassName ?? 'flex-1')} variant={submitVariant}>
        {pending ? (
          <>
            <Loader2 className='w-4 h-4 mr-2 animate-spin' />
            {loadingText}
          </>
        ) : (
          submitText
        )}
      </Button>
      {!hideCancel && onCancel && (
        <Button type='button' variant='outline' onClick={onCancel} disabled={pending} className={cancelClassName}>
          {cancelText}
        </Button>
      )}
    </div>
  );
};
