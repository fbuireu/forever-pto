'use client';

import { usePremiumStore } from '@application/stores/premium';
import { Button } from '@const/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@const/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@const/components/ui/form';
import { Input } from '@const/components/ui/input';
import { Textarea } from '@const/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { sendContactEmail } from '@infrastructure/actions/contact';
import { AlertCircle, Mail } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';
import { FormButtons } from './FormButtons';
import { ContactFormData, contactSchema } from './schema';
import { CircleCheckBig } from 'src/components/animate-ui/icons/circle-check-big';

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
    onClose();
    setStep(Step.INPUT);
    form.reset();
    setErrorMessage('');
  };

  const onSubmit = async (data: ContactFormData) => {
    const result = await sendContactEmail(data);
    setEmail(data.email);

    if (result.success) {
      setStep(Step.SUCCESS);
    } else {
      setErrorMessage(result.error || 'Failed to send message');
      setStep(Step.ERROR);
    }
  };

  const handleTryAgain = () => {
    setStep(Step.INPUT);
    setErrorMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-lg' onOpenAutoFocus={(e) => e.preventDefault()}>
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
                      <Input placeholder='John Doe' {...field} />
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
                      <Input type='email' placeholder='your@email.com' autoFocus={!userEmail} {...field} />
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
                      <Input placeholder='What is this about?' {...field} />
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
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormButtons onCancel={handleClose} />
            </form>
          </Form>
        )}

        {step === Step.SUCCESS && (
          <div className='text-center space-y-4 py-4'>
            <CircleCheckBig animateOnView loop className='w-12 h-12 text-green-500 mx-auto' />
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
