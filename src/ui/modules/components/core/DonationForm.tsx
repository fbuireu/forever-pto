'use client';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@const/components/ui/form';
import { Input } from '@const/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@const/components/ui/input-group';
import { Label } from '@const/components/ui/label';
import { cn } from '@const/lib/utils';
import { amountFormatter } from '@shared/utils/helpers';
import { useCallback, useMemo, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from 'src/components/animate-ui/radix/collapsible';
import { ChevronDown } from 'src/components/animate-ui/icons/chevron-down';
import { DonationFormData } from './Donate';

const PRESET_AMOUNTS = [5, 10, 15] as const;

interface DonationFormProps {
  form: UseFormReturn<DonationFormData>;
  onSubmit: (data: DonationFormData) => void;
  isPending: boolean;
  currentAmount: number;
  locale: string;
  currency: string;
  currencySymbol: string;
}

export function DonationForm({
  form,
  onSubmit,
  isPending,
  currentAmount,
  locale,
  currency,
  currencySymbol,
}: DonationFormProps) {
  const [showPromoCode, setShowPromoCode] = useState(false);
  const { setValue } = form;

  const amount = useMemo(() => amountFormatter(locale), [locale]);

  const handlePresetClick = useCallback(
    (value: number) => {
      setValue('amount', value, { shouldValidate: true });
    },
    [setValue]
  );

  return (
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
                {amount.format(preset)}
              </Button>
            ))}
          </div>
        </div>
        <FormField
          control={form.control}
          name='amount'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Donation Amount</FormLabel>
              <FormControl>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>{currencySymbol}</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    type='number'
                    placeholder='Enter amount'
                    step='1'
                    min='1'
                    max='10000'
                    disabled={isPending}
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === '' ? undefined : parseFloat(value));
                    }}
                  />
                </InputGroup>
              </FormControl>
              <p className='text-xs text-muted-foreground mt-1'>
                Base price in {currency}. Final amount will be converted to your local currency at current exchange
                rates.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        <Collapsible open={showPromoCode} onOpenChange={setShowPromoCode}>
          <CollapsibleTrigger className='flex items-center justify-between w-full p-2 text-sm font-medium hover:bg-muted/50 cursor-pointer rounded-md transition-colors'>
            <span className='text-muted-foreground'>Have a promo code?</span>
            <ChevronDown
              animateOnHover
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform duration-200',
                showPromoCode && 'rotate-180'
              )}
              aria-hidden='true'
            />
          </CollapsibleTrigger>
          {showPromoCode && (
            <CollapsibleContent className='pt-2 min-h-[60px]'>
              <FormField
                control={form.control}
                name='promoCode'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type='text'
                        placeholder='YOU_WISH_IT_WAS_THAT_EASY'
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
  );
}
