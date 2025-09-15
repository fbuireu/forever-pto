'use client';

import { useFiltersState } from '@application/stores/filters';
import { Field, Label } from '@headlessui/react';
import { InfoIcon, Undo2 } from 'lucide-react';
import { Switch } from 'src/components/animate-ui/headless/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'src/components/animate-ui/radix/tooltip';
import { PremiumFeature } from '../../premium/PremiumFeature';

export const AllowPastDays = () => {
  const { allowPastDays, setAllowPastDays } = useFiltersState();

  return (
    <Field className='space-y-2 w-full'>
      <Label className='flex gap-2 my-2 text-sm font-normal' htmlFor='allow-past-days'>
        <Undo2 size={16} /> Allow Past Days
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild className='ml-auto'>
              <InfoIcon className='h-4 w-4 text-muted-foreground cursor-help' />
            </TooltipTrigger>
            <TooltipContent className='w-50 text-pretty'>
              This switch allows you to enable or disable the suggestion of past holidays for the selected year. This
              lets you see PTO opportunities that were missed in the past
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Label>
      <PremiumFeature feature='Allow Past Days'>
      <div className='flex gap-2 w-full'>
        <Switch
          checked={allowPastDays}
          id='allow-past-days'
          onChange={(checked) => setAllowPastDays(checked as boolean)}
        />
        <p className='font-normal text-sm'>{allowPastDays ? 'Enabled' : 'Disabled'}</p>
      </div>
      </PremiumFeature>
    </Field>
  );
};
