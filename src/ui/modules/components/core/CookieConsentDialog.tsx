import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@const/components/ui/dialog';
import { Label } from '@const/components/ui/label';
import { Info } from 'lucide-react';
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from 'src/components/animate-ui/base/accordion';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import { Switch } from 'src/components/animate-ui/headless/switch';

interface CookieConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analyticsEnabled: boolean;
  onAnalyticsChange: (checked: boolean) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onSave: () => void;
}

export const CookieConsentDialog = ({
  open,
  onOpenChange,
  analyticsEnabled,
  onAnalyticsChange,
  onAcceptAll,
  onRejectAll,
  onSave,
}: CookieConsentDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Cookie preferences</DialogTitle>
          <DialogDescription>
            We use cookies to improve your browsing experience and analyze site traffic. Choose which cookies you want
            to accept.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          <div className='rounded-lg border bg-card p-4 space-y-3'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex-1'>
                <Label className='text-base font-semibold'>Necessary cookies</Label>
                <p className='text-sm text-muted-foreground mt-1'>
                  Essential for the website to function. Cannot be disabled.
                </p>
              </div>
              <Switch checked disabled />
            </div>

            <Accordion>
              <AccordionItem value='necessary-details' className='border-none'>
                <AccordionTrigger className='text-sm font-medium hover:no-underline py-2 justify-start gap-2'>
                  <span className='flex items-center gap-2'>
                    <Info className='h-4 w-4' />
                    Cookie details
                  </span>
                </AccordionTrigger>
                <AccordionPanel>
                  <div className='space-y-4 pt-3'>
                    <div className='rounded-md bg-muted/50 p-3 space-y-1'>
                      <div className='flex items-center justify-between'>
                        <span className='font-mono text-sm font-medium'>user-country</span>
                        <span className='text-xs text-muted-foreground'>Session</span>
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        Stores your country location for content localization
                      </p>
                    </div>

                    <div className='rounded-md bg-muted/50 p-3 space-y-1'>
                      <div className='flex items-center justify-between'>
                        <span className='font-mono text-sm font-medium'>cc_cookie</span>
                        <span className='text-xs text-muted-foreground'>6 months</span>
                      </div>
                      <p className='text-sm text-muted-foreground'>Stores your cookie consent preferences</p>
                    </div>

                    <div className='rounded-md bg-muted/50 p-3 space-y-1'>
                      <div className='flex items-center justify-between'>
                        <span className='font-mono text-sm font-medium'>__stripe_mid</span>
                        <span className='text-xs text-muted-foreground'>1 year</span>
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        Fraud prevention and detection. Set by Stripe for secure payment processing.
                      </p>
                      <p className='text-xs text-muted-foreground'>Provider: Stripe</p>
                    </div>

                    <div className='rounded-md bg-muted/50 p-3 space-y-1'>
                      <div className='flex items-center justify-between'>
                        <span className='font-mono text-sm font-medium'>__stripe_sid</span>
                        <span className='text-xs text-muted-foreground'>30 minutes</span>
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        Session identifier for fraud prevention. Required for checkout process.
                      </p>
                      <p className='text-xs text-muted-foreground'>Provider: Stripe</p>
                    </div>
                  </div>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </div>

          <div className='rounded-lg border bg-card p-4 space-y-3'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex-1'>
                <Label className='text-base font-semibold'>Analytics cookies</Label>
                <p className='text-sm text-muted-foreground mt-1'>
                  Help us understand visitor behavior through anonymous data collection.
                </p>
              </div>
              <Switch checked={analyticsEnabled} onChange={(checked) => onAnalyticsChange(checked as boolean)} />
            </div>

            <Accordion>
              <AccordionItem value='analytics-details' className='border-none'>
                <AccordionTrigger className='text-sm font-medium hover:no-underline py-2 justify-start gap-2'>
                  <span className='flex items-center gap-2'>
                    <Info className='h-4 w-4' />
                    Cookie details
                  </span>
                </AccordionTrigger>
                <AccordionPanel>
                  <div className='space-y-4 pt-3'>
                    <div className='rounded-md bg-muted/50 p-3 space-y-1'>
                      <div className='flex items-center justify-between'>
                        <span className='font-mono text-sm font-medium'>_ga</span>
                        <span className='text-xs text-muted-foreground'>2 years</span>
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        Distinguishes unique users.
                        <a
                          href='https://policies.google.com/technologies/cookies'
                          target='_blank'
                          rel='noopener noreferrer'
                          className='ml-1 underline hover:text-foreground'
                        >
                          Learn more
                        </a>
                      </p>
                      <p className='text-xs text-muted-foreground'>Provider: Google Analytics</p>
                    </div>

                    <div className='rounded-md bg-muted/50 p-3 space-y-1'>
                      <div className='flex items-center justify-between'>
                        <span className='font-mono text-sm font-medium'>_ga_*</span>
                        <span className='text-xs text-muted-foreground'>2 years</span>
                      </div>
                      <p className='text-sm text-muted-foreground'>Maintains session state for analytics tracking</p>
                      <p className='text-xs text-muted-foreground'>Provider: Google Analytics</p>
                    </div>

                    <div className='rounded-md bg-muted/50 p-3 space-y-1'>
                      <div className='flex items-center justify-between'>
                        <span className='font-mono text-sm font-medium'>_gid</span>
                        <span className='text-xs text-muted-foreground'>24 hours</span>
                      </div>
                      <p className='text-sm text-muted-foreground'>Distinguishes users for short-term analytics</p>
                      <p className='text-xs text-muted-foreground'>Provider: Google Analytics</p>
                    </div>
                  </div>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        <DialogFooter className='flex-col-reverse sm:flex-row gap-2 pt-4 border-t'>
          <Button variant='outline' onClick={onRejectAll} className='w-full sm:w-auto'>
            Reject all
          </Button>
          <div className='flex gap-2 w-full sm:w-auto'>
            <Button variant='secondary' onClick={onSave} className='flex-1 sm:flex-initial'>
              Save preferences
            </Button>
            <Button onClick={onAcceptAll} className='flex-1 sm:flex-initial'>
              Accept all
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
