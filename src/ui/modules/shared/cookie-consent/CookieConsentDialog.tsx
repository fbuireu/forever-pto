import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from '@ui/modules/core/animate/base/Accordion';
import { Switch } from '@ui/modules/core/animate/primitives/base/Switch';
import { Button } from '@ui/modules/core/primitives/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@ui/modules/core/primitives/Dialog';
import { Label } from '@ui/modules/core/primitives/Label';
import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { COOKIE_SECTIONS } from './config/config';
import type { CookieEntry } from './config/config';

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

  const isAnalyticsSection = (id: string) => id === 'analytics';

  const renderCookieEntry = (cookie: CookieEntry) => (
    <div key={cookie.name} className='rounded-md bg-muted/50 p-3 space-y-1'>
      <div className='flex items-center justify-between'>
        <span className='font-mono text-sm font-medium'>{cookie.name}</span>
        <span className='text-xs text-muted-foreground'>
          {cookie.expiryParams ? t(cookie.expiryKey, cookie.expiryParams) : t(cookie.expiryKey)}
        </span>
      </div>
      <p className='text-sm text-muted-foreground'>
        {t(cookie.descriptionKey)}
        {cookie.learnMoreUrl && (
          <a
            href={cookie.learnMoreUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='ml-1 underline hover:text-foreground'
          >
            {t('learnMore')}
          </a>
        )}
      </p>
      <p className='text-xs text-muted-foreground'>{t('provider', { name: cookie.provider })}</p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{t('preferencesTitle')}</DialogTitle>
          <DialogDescription>{t('preferencesDescription')}</DialogDescription>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          {COOKIE_SECTIONS.map((section) => (
            <div
              key={section.id}
              className='rounded-[12px] border-[3px] border-[var(--frame)] bg-card p-4 space-y-3 shadow-[var(--shadow-brutal-xs)]'
            >
              <div className='flex items-start justify-between gap-4'>
                <div className='flex-1'>
                  <Label className='text-base font-semibold'>{t(`${section.id}Cookies`)}</Label>
                  <p className='text-sm text-muted-foreground mt-1'>
                    {t(`${section.id}Description`)}
                  </p>
                </div>
                {isAnalyticsSection(section.id) ? (
                  <Switch checked={analyticsEnabled} onCheckedChange={onAnalyticsChange} />
                ) : (
                  <Switch checked disabled />
                )}
              </div>

              <Accordion>
                <AccordionItem value={`${section.id}-details`} className='border-none'>
                  <AccordionTrigger className='text-sm font-medium hover:no-underline py-2 gap-2'>
                    <span className='flex items-center gap-2'>
                      <Info className='size-4' />
                      {t('cookieDetails')}
                    </span>
                  </AccordionTrigger>
                  <AccordionPanel>
                    <div className='space-y-4 pt-3'>{section.cookies.map(renderCookieEntry)}</div>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </div>
          ))}
        </div>

        <DialogFooter className='flex-col-reverse sm:flex-row gap-2 pt-4 border-t'>
          <Button variant='destructive' onClick={onRejectAll} className='w-full sm:w-auto'>
            {t('rejectAll')}
          </Button>
          <div className='flex gap-2 w-full items-center sm:w-auto'>
            <Button variant='secondary' onClick={onSave} className='flex-1 sm:flex-initial'>
              {t('savePreferences')}
            </Button>
            <Button variant='success' onClick={onAcceptAll} className='flex-1 sm:flex-initial'>
              {t('acceptAll')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
