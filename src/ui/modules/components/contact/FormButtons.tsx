import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "src/components/animate-ui/components/buttons/button";

export const FormButtons = ({ onCancel }: { onCancel: () => void }) => {
  const { pending } = useFormStatus();

  return (
    <div className='flex gap-2 pt-2'>
      <Button type='submit' disabled={pending} className='flex-1'>
        {pending ? (
          <>
            <Loader2 className='w-4 h-4 mr-2 animate-spin' />
            Sending...
          </>
        ) : (
          'Send Message'
        )}
      </Button>
      <Button type='button' variant='outline' onClick={onCancel} disabled={pending}>
        Cancel
      </Button>
    </div>
  );
};
