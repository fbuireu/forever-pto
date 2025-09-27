'use client';

import { usePremiumStore } from '@application/stores/premium';
import { Button } from '@const/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@const/components/ui/form';
import { Input } from '@const/components/ui/input';
import { Label } from '@const/components/ui/label';
import { zodResolver } from '@hookform/resolvers/zod';
import { getStripeClient } from '@infrastructure/payments/stripe/client';
import { Star } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from 'src/components/animate-ui/radix/popover';
import * as z from 'zod';
import { useShallow } from 'zustand/react/shallow';

const donationSchema = z.object({
  amount: z
    .number({
      error: 'Amount is required',
    })
    .min(0.01, 'Amount must be at least 0.01')
    .max(10000, 'Amount cannot exceed 10,000')
    .multipleOf(0.01, 'Amount must have maximum 2 decimal places'),
  email: z.email('Please enter a valid email address').min(1, 'Email is required'),
});

type DonationFormData = z.infer<typeof donationSchema>;

const PRESET_AMOUNTS = [5, 10, 15];

export const Donate = () => {
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { premiumKey, setPremiumStatus } = usePremiumStore(
    useShallow((state) => ({
      premiumKey: state.premiumKey,
      setPremiumStatus: state.setPremiumStatus,
    }))
  );

  const form = useForm<DonationFormData>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      amount: 1,
      email: '',
    },
  });

  const { watch, setValue, formState } = form;
  const currentAmount = watch('amount');

  const handlePresetClick = (value: number) => {
    setValue('amount', value, { shouldValidate: true });
  };

  const onSubmit = async (data: DonationFormData) => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: data.amount,
            email: data.email,
          }),
        });

        const { client_secret } = await response.json();

        const stripeClient = getStripeClient();
        const result = await stripeClient.confirmPayment({
          clientSecret: client_secret,
          returnUrl: window.location.href,
          alwaysRedirect: false,
        });

        if (result.success) {
          setPremiumStatus({ email: data.email, premiumKey: client_secret });
          toast.success(`Thank you! Donation of €${data.amount.toFixed(2)} processed successfully.`);
          form.reset();
          setIsOpen(false);
        } else {
          throw new Error(result.error);
        }
      } catch (_) {
        toast.error('Payment failed', {
          description: 'Please try again.',
        });
      }
    });
  };

  const isPresetSelected = (preset: number) => currentAmount === preset;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button className='fixed bottom-4 right-4 z-50 shadow-lg'>Donate & Unblock</Button>
      </PopoverTrigger>
      <PopoverContent className='w-80'>
        <div className='grid gap-4'>
          <div className='space-y-2'>
            <h4 className='leading-none font-medium'>Support & Unblock</h4>
            <p className='text-muted-foreground text-sm'>Make a donation to support the content and unblock access.</p>
            {premiumKey && (
              <div className='flex items-center gap-2 p-2 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700'>
                <Star className='w-4 h-4 text-green-500' fill='currentColor' />
                <span className='text-green-700 dark:text-green-300 font-semibold text-sm'>
                  You are a premium user already. Thank you for your support!
                </span>
              </div>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate className='grid gap-3'>
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
                        {...field}
                        className='h-10'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='amount'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (€)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='Enter amount'
                        step='0.01'
                        min='0'
                        disabled={isPending}
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? undefined : parseFloat(value));
                        }}
                        className='h-10'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='space-y-2'>
                <Label>Quick amounts</Label>
                <div className='flex gap-2'>
                  {PRESET_AMOUNTS.map((preset) => {
                    const amount = new Intl.NumberFormat(locale, {
                      style: 'currency',
                      currency: 'EUR',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(preset);
                    return (
                      <Button
                        key={preset}
                        type='button'
                        variant={isPresetSelected(preset) ? 'default' : 'outline'}
                        size='sm'
                        onClick={() => handlePresetClick(preset)}
                        disabled={isPending}
                        className='flex-1'
                      >
                        {amount}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <Button
                type='submit'
                disabled={!formState.isValid || isPending}
                className='w-full bg-green-600 hover:bg-green-700'
              >
                {isPending ? 'Processing...' : `Donate ${currentAmount ? `€${currentAmount.toFixed(2)}` : ''}`}
              </Button>
            </form>
          </Form>
        </div>
      </PopoverContent>
    </Popover>
  );
};
