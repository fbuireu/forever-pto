'use client';

import { usePremiumStore } from '@application/stores/premium';
import { Button } from '@const/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@const/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@const/components/ui/form';
import { Input } from '@const/components/ui/input';
import { Textarea } from '@const/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';
import { ContactFormData, contactSchema } from './schema';

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
}

const Step = {
  INPUT: 'input',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

type Step = (typeof Step)[keyof typeof Step];

export const ContactModal = ({ open, onClose }: ContactModalProps) => {
  const [step, setStep] = useState<Step>(Step.INPUT);
  const [isPending, startTransition] = useTransition();
  const { setEmail, userEmail } = usePremiumStore(
    useShallow((state) => ({
      setEmail: state.setEmail,
      userEmail: state.userEmail,
    }))
  );
  const [errorMessage, setErrorMessage] = useState<string>('');

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    values: {
      email: userEmail ?? '',
      name: '',
      subject: '',
      message: '',
    },
  });

  const handleClose = () => {
    form.reset();
    setStep(Step.INPUT);
    setErrorMessage('');
    onClose();
  };

  const onSubmit = async (data: ContactFormData) => {
    // startTransition(async () => {
    //   const result = await sendContactEmail(data);
    setEmail(data.email);
    //   if (result.success) {
    //     setStep(Step.SUCCESS);
    //  setEmail(data.email);
    //     toast.success('Message sent successfully!');
    //     setTimeout(() => {
    //       handleClose();
    //     }, 2000);
    //   } else {
    //     setErrorMessage(result.error || 'Failed to send message');
    // toast.error('Failed to send message');
    //     setStep(Step.ERROR);
    //   }
    // });
  };

  const handleTryAgain = () => {
    setStep(Step.INPUT);
    setErrorMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Mail className='w-5 h-5 text-primary' />
            Contact Us
          </DialogTitle>
          <DialogDescription>Have a question or feedback? We'd love to hear from you!</DialogDescription>
        </DialogHeader>

        {step === Step.INPUT && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4' noValidate>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder='John Doe' disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        placeholder='your@email.com'
                        disabled={isPending}
                        autoFocus={!userEmail}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='subject'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder='What is this about?' disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='message'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Tell us what you need...'
                        className='min-h-[120px] resize-none field-sizing-content'
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex gap-2 pt-2'>
                <Button type='submit' disabled={isPending} className='flex-1'>
                  {isPending ? (
                    <>
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      Sending...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </Button>
                <Button type='button' variant='outline' onClick={handleClose} disabled={isPending}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        )}

        {step === Step.SUCCESS && (
          <div className='text-center space-y-4 py-4'>
            <CheckCircle2 className='w-12 h-12 text-green-500 mx-auto' />
            <div>
              <h3 className='font-semibold text-green-600'>Message Sent!</h3>
              <p className='text-sm text-muted-foreground mt-1'>We'll get back to you as soon as possible.</p>
            </div>
          </div>
        )}

        {step === Step.ERROR && (
          <div className='text-center space-y-4 py-4'>
            <AlertCircle className='w-12 h-12 text-destructive mx-auto' />
            <div>
              <h3 className='font-semibold'>Failed to Send</h3>
              <p className='text-sm text-muted-foreground mt-1'>{errorMessage}</p>
            </div>
            <div className='flex gap-2 pt-2'>
              <Button onClick={handleTryAgain} variant='outline' className='flex-1'>
                Try Again
              </Button>
              <Button onClick={handleClose} className='flex-1'>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
