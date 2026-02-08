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
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('cookies');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{t('preferencesTitle')}</DialogTitle>
          <DialogDescription>{t('preferencesDescription')}</DialogDescription>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          <div className='rounded-lg border bg-card p-4 space-y-3'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex-1'>
                <Label className='text-base font-semibold'>{t('necessaryCookies')}</Label>
                <p className='text-sm text-muted-foreground mt-1'>{t('necessaryDescription')}</p>
              </div>
              <Switch checked disabled />
            </div>

            <Accordion>
              <AccordionItem value='necessary-details' className='border-none'>
                <AccordionTrigger className='text-sm font-medium hover:no-underline py-2 justify-start gap-2'>
                  <span className='flex items-center gap-2'>
                    <Info className='h-4 w-4' />
                    {t('cookieDetails')}
                  </span>
                </AccordionTrigger>
                <AccordionPanel>
                  <div className='space-y-4 pt-3'>
                    <div className='rounded-md bg-muted/50 p-3 space-y-1'>
                      <div className='flex items-center justify-between'>
                        <span className='font-mono text-sm font-medium'>user-country</span>
                        <span className='text-xs text-muted-foreground'>1 {t('week')}</span>
                      </div>
                      <p className='text-sm text-muted-foreground'>{t('userCountryDesc')}</p>
                    </div>

                    <div className='rounded-md bg-muted/50 p-3 space-y-1'>
                      <div className='flex items-center justify-between'>
                        <span className='font-mono text-sm font-medium'>cc_cookie</span>
                        <span className='text-xs text-muted-foreground'>{t('months', { count: 6 })}</span>
                      </div>
                      <p className='text-sm text-muted-foreground'>{t('ccCookieDesc')}</p>
                    </div>

                    <div className='rounded-md bg-muted/50 p-3 space-y-1'>
                      <div className='flex items-center justify-between'>
                        <span className='font-mono text-sm font-medium'>__stripe_mid</span>
                        <span className='text-xs text-muted-foreground'>{t('year', { count: 1 })}</span>
                      </div>
                      <p className='text-sm text-muted-foreground'>{t('stripeMidDesc')}</p>
                      <p className='text-xs text-muted-foreground'>{t('provider', { name: 'Stripe' })}</p>
                    </div>

                    <div className='rounded-md bg-muted/50 p-3 space-y-1'>
                      <div className='flex items-center justify-between'>
                        <span className='font-mono text-sm font-medium'>__stripe_sid</span>
                        <span className='text-xs text-muted-foreground'>{t('minutes', { count: 30 })}</span>
                      </div>
                      <p className='text-sm text-muted-foreground'>{t('stripeSidDesc')}</p>
                      <p className='text-xs text-muted-foreground'>{t('provider', { name: 'Stripe' })}</p>
                    </div>
                  </div>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </div>

          <div className='rounded-lg border bg-card p-4 space-y-3'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex-1'>
                <Label className='text-base font-semibold'>{t('analyticsCookies')}</Label>
                <p className='text-sm text-muted-foreground mt-1'>{t('analyticsDescription')}</p>
              </div>
              <Switch checked={analyticsEnabled} onChange={(checked) => onAnalyticsChange(checked as boolean)} />
            </div>

            <Accordion>
              <AccordionItem value='analytics-details' className='border-none'>
                <AccordionTrigger className='text-sm font-medium hover:no-underline py-2 justify-start gap-2'>
                  <span className='flex items-center gap-2'>
                    <Info className='h-4 w-4' />
                    {t('cookieDetails')}
                  </span>
                </AccordionTrigger>
                <AccordionPanel>
                  <div className='space-y-4 pt-3'>
                    <div className='rounded-md bg-muted/50 p-3 space-y-1'>
                      <div className='flex items-center justify-between'>
                        <span className='font-mono text-sm font-medium'>_ga</span>
                        <span className='text-xs text-muted-foreground'>{t('years', { count: 2 })}</span>
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        {t('gaDesc')}
                        <a
                          href='https://policies.google.com/technologies/cookies'
                          target='_blank'
                          rel='noopener noreferrer'
                          className='ml-1 underline hover:text-foreground'
                        >
                          {t('learnMore')}
                        </a>
                      </p>
                      <p className='text-xs text-muted-foreground'>{t('provider', { name: 'Google Analytics' })}</p>
                    </div>

                    <div className='rounded-md bg-muted/50 p-3 space-y-1'>
                      <div className='flex items-center justify-between'>
                        <span className='font-mono text-sm font-medium'>_ga_*</span>
                        <span className='text-xs text-muted-foreground'>{t('years', { count: 2 })}</span>
                      </div>
                      <p className='text-sm text-muted-foreground'>{t('gaStarDesc')}</p>
                      <p className='text-xs text-muted-foreground'>{t('provider', { name: 'Google Analytics' })}</p>
                    </div>

                    <div className='rounded-md bg-muted/50 p-3 space-y-1'>
                      <div className='flex items-center justify-between'>
                        <span className='font-mono text-sm font-medium'>_gid</span>
                        <span className='text-xs text-muted-foreground'>{t('hours', { count: 24 })}</span>
                      </div>
                      <p className='text-sm text-muted-foreground'>{t('gidDesc')}</p>
                      <p className='text-xs text-muted-foreground'>{t('provider', { name: 'Google Analytics' })}</p>
                    </div>
                  </div>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        <DialogFooter className='flex-col-reverse sm:flex-row gap-2 pt-4 border-t'>
          <Button variant='outline' onClick={onRejectAll} className='w-full sm:w-auto'>
            {t('rejectAll')}
          </Button>
          <div className='flex gap-2 w-full sm:w-auto'>
            <Button variant='secondary' onClick={onSave} className='flex-1 sm:flex-initial'>
              {t('savePreferences')}
            </Button>
            <Button onClick={onAcceptAll} className='flex-1 sm:flex-initial'>
              {t('acceptAll')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
