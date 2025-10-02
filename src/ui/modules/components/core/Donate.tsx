'use client';

import { DiscountInfo, PaymentDTO } from '@application/dto/payment/types';
import { usePremiumStore } from '@application/stores/premium';
import { Button } from '@const/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@const/components/ui/form';
import { Input } from '@const/components/ui/input';
import { Label } from '@const/components/ui/label';
import { cn } from '@const/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { getStripeClient } from '@infrastructure/payments/stripe/client';
import { ChevronDown, Star } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useCallback, useMemo, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from 'src/components/animate-ui/radix/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from 'src/components/animate-ui/radix/popover';
import * as z from 'zod';
import { useShallow } from 'zustand/react/shallow';
import PaymentForm from './PaymentForm';

const donationSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .min(0.01, 'Amount must be at least €0.01')
    .max(10000, 'Amount cannot exceed €10,000')
    .multipleOf(0.01, 'Amount must have maximum 2 decimal places'),
  email: z.string().email('Please enter a valid email address').min(1, 'Email is required'),
  promoCode: z.string().optional(),
});

type DonationFormData = z.infer<typeof donationSchema>;

const PRESET_AMOUNTS = [5, 10, 15] as const;

interface PaymentState {
  clientSecret: string;
  data: DonationFormData;
  discountInfo: DiscountInfo | null;
}

const stripeClient = getStripeClient();

const premiumSelector = (state) => ({
  premiumKey: state.premiumKey,
  setPremiumStatus: state.setPremiumStatus,
});

export const Donate = () => {
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [showPromoCode, setShowPromoCode] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [paymentState, setPaymentState] = useState<PaymentState | null>(null);

  const { premiumKey, setPremiumStatus } = usePremiumStore(useShallow(premiumSelector));

  const form = useForm<DonationFormData>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      amount: 5,
      email: '',
      promoCode: '',
    },
  });

  const { watch, setValue } = form;
  const currentAmount = watch('amount');

  const amountFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    [locale]
  );

  const formatAmount = useCallback((amount: number): string => amountFormatter.format(amount), [amountFormatter]);

  const handlePresetClick = useCallback(
    (value: number) => {
      setValue('amount', value, { shouldValidate: true });
    },
    [setValue]
  );

  const handlePaymentInitialization = useCallback(async (data: DonationFormData): Promise<PaymentDTO> => {
    const response = await fetch('/api/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: data.amount,
        email: data.email,
        promoCode: data.promoCode?.trim() || undefined,
      }),
    });

    const result: PaymentDTO = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Payment initialization failed');
    }

    if (!result.clientSecret) {
      throw new Error('No client secret received');
    }

    return result;
  }, []);

  const showDiscountToast = useCallback((discountInfo: DiscountInfo) => {
    const discountValue =
      discountInfo.type === 'percent' ? `${discountInfo.value}%` : `€${discountInfo.value.toFixed(2)}`;

    toast.success('Promo code applied!', {
      description: `${discountValue} discount - New amount: €${discountInfo.finalAmount.toFixed(2)}`,
    });
  }, []);

  const onSubmit = useCallback(
    async (data: DonationFormData) => {
      startTransition(async () => {
        try {
          const result = await handlePaymentInitialization(data);

          if (result.discountInfo) {
            showDiscountToast(result.discountInfo);
          }

          setPaymentState({
            clientSecret: result.clientSecret!,
            data,
            discountInfo: result.discountInfo || null,
          });
        } catch (error) {
          toast.error('Payment initialization failed', {
            description: error instanceof Error ? error.message : 'Please try again.',
          });
        }
      });
    },
    [handlePaymentInitialization, showDiscountToast]
  );

  const handlePaymentSuccess = useCallback(() => {
    if (!paymentState) return;

    setPremiumStatus({
      email: paymentState.data.email,
      premiumKey: paymentState.clientSecret,
    });

    toast.success('Payment successful!', {
      description: 'Thank you for your support! You now have premium access.',
    });

    form.reset();
    setPaymentState(null);
    setShowPromoCode(false);
    setIsOpen(false);
  }, [paymentState, setPremiumStatus, form]);

  const handlePaymentCancel = useCallback(() => {
    setPaymentState(null);
  }, []);

  const finalAmount = paymentState?.discountInfo?.finalAmount ?? currentAmount;

  const hasPremium = Boolean(premiumKey);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal>
      <PopoverTrigger asChild>
        <Button className='fixed bottom-4 right-4 z-50 shadow-lg'>Donate & Unblock</Button>
      </PopoverTrigger>
      <PopoverContent className='w-96'>
        <div className='grid gap-4'>
          <div className='space-y-2'>
            <h4 className='leading-none font-medium'>Support & Unblock</h4>
            <p className='text-muted-foreground text-sm'>Make a donation to support the content and unblock access.</p>
            {hasPremium && (
              <div className='flex items-center gap-2 p-2 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700'>
                <Star className='w-4 h-4 text-green-500' fill='currentColor' aria-hidden='true' />
                <span className='text-green-700 dark:text-green-300 font-semibold text-sm'>
                  You are a premium user already. Thank you for your support!
                </span>
              </div>
            )}
          </div>

          {!paymentState ? (
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
                          autoComplete='email'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='space-y-2'>
                  <Label>Quick amounts</Label>
                  <div className='flex gap-2'>
                    {PRESET_AMOUNTS.map((preset) => (
                      <Button
                        key={preset}
                        type='button'
                        variant={currentAmount === preset ? 'default' : 'outline'}
                        size='sm'
                        onClick={() => handlePresetClick(preset)}
                        disabled={isPending}
                        className='flex-1'
                      >
                        {formatAmount(preset)}
                      </Button>
                    ))}
                  </div>
                </div>

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
                          min='0.01'
                          max='10000'
                          disabled={isPending}
                          {...field}
                          value={field.value ?? ''}
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

                <Collapsible open={showPromoCode} onOpenChange={setShowPromoCode}>
                  <CollapsibleTrigger className='flex items-center justify-between w-full p-2 text-sm font-medium hover:bg-muted/50 cursor-pointer rounded-md transition-colors'>
                    <span className='text-muted-foreground'>Have a promo code?</span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-muted-foreground transition-transform duration-200',
                        showPromoCode && 'rotate-180'
                      )}
                      aria-hidden='true'
                    />
                  </CollapsibleTrigger>
                  {showPromoCode && (
                    <CollapsibleContent className='pt-2'>
                      <FormField
                        control={form.control}
                        name='promoCode'
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type='text'
                                placeholder='Enter promo code'
                                disabled={isPending}
                                {...field}
                                className='h-10 uppercase'
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CollapsibleContent>
                  )}
                </Collapsible>

                <Button type='submit' disabled={isPending} className='w-full bg-green-600 hover:bg-green-700'>
                  {isPending ? 'Processing...' : 'Continue to Payment'}
                </Button>
              </form>
            </Form>
          ) : (
            <PaymentForm
              stripe={stripeClient.getStripePromise()}
              clientSecret={paymentState.clientSecret}
              amount={finalAmount}
              email={paymentState.data.email}
              discountInfo={paymentState.discountInfo}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
