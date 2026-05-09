import {
  SIDEBAR_COOKIE_NAME,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@ui/modules/core/animate/base/Sidebar';
import { ChevronDown } from '@ui/modules/core/animate/icons/ChevronDown';
import { AnimateIcon } from '@ui/modules/core/animate/icons/Icon';
import { Settings } from '@ui/modules/core/animate/icons/Settings';
import { Calculator } from 'lucide-react';
import dynamic from 'next/dynamic';
import { cookies } from 'next/headers';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { Logo } from '../shared/Logo';
import { Countries } from './components/Countries';
import { PtoDays } from './components/PtoDays';
import { SidebarCollapsibleGroup } from './components/SidebarCollapsibleGroup';
import { SidebarFooterButtons } from './components/SidebarFooterButtons';

const Regions = dynamic(() => import('./components/Regions').then((m) => m.Regions));
const Years = dynamic(() => import('./components/Years').then((m) => m.Years));
const Strategy = dynamic(() => import('./components/Strategy').then((m) => m.Strategy));
const AllowPastDays = dynamic(() => import('./components/AllowPastDays').then((m) => m.AllowPastDays));
const CarryOverMonths = dynamic(() => import('./components/CarryOverMonths').then((m) => m.CarryOverMonths));
const PtoCalculator = dynamic(() => import('./components/PtoCalculator').then((m) => m.PtoCalculator));
const PtoSalaryCalculator = dynamic(() =>
  import('./components/PtoSalaryCalculator').then((m) => m.PtoSalaryCalculator)
);
const WorkdayCounter = dynamic(() => import('./components/WorkdayCounter').then((m) => m.WorkdayCounter));
const CalendarExport = dynamic(() => import('./components/CalendarExport').then((m) => m.CalendarExport));

const STEP_CARD_CLASS =
  'bg-sidebar border-[3px] border-[var(--frame)] rounded-[14px] shadow-[6px_6px_0_0_var(--frame)] p-[18px]';

interface AppSidebarProps {
  children: React.ReactNode;
  locale: Locale;
}

export const AppSidebar = async ({ locale, children }: AppSidebarProps) => {
  const t = await getTranslations('sidebar');
  const cookieStore = await cookies();
  const sidebarOpen = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== 'false';

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <Sidebar collapsible='icon' variant='inset'>
        <SidebarHeader className='group-data-[collapsible=icon]:p-0 mb-2.5'>
          <SidebarMenu>
            <SidebarMenuItem>
              <Logo />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className='rounded-[12px] mt-2 bg-[var(--surface-panel-soft)] group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0'>
            <SidebarGroupLabel role='heading' aria-level={2}>
              {t('configuration')}
            </SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarCollapsibleGroup
                  defaultOpen
                  data-tutorial='sidebar-filters'
                  trigger={
                    <SidebarMenuButton variant='outline' tooltip={t('steps')}>
                      <AnimateIcon animateOnHover>
                        <Settings className='h-5 w-5 shrink-0' />
                      </AnimateIcon>
                      <span className='group-data-[collapsible=icon]:hidden'>{t('steps')}</span>
                      <ChevronDown className='ml-auto -rotate-90 transition-transform group-data-[open]/collapsible:rotate-0 group-data-[collapsible=icon]:hidden' />
                    </SidebarMenuButton>
                  }
                >
                  <div className='px-1 pt-2 pb-1 space-y-[18px]'>
                    <div data-tutorial='sidebar-step-1' className={STEP_CARD_CLASS}>
                      <h3 className='font-display font-extrabold text-[18px] tracking-tight mb-3.5 flex items-center gap-2 leading-none'>
                        <span>
                          {t('step1.titleStart')}
                          <em className='font-serif italic font-normal'>{t('step1.titleEmphasis')}</em>
                        </span>
                        <span className='ml-auto shrink-0 font-mono text-[10px] font-bold uppercase bg-[var(--color-brand-yellow)] text-[var(--color-brand-ink)] px-1.5 py-0.5 rounded-[5px] tracking-[0.08em]'>
                          {t('step1.badge', { step: 1 })}
                        </span>
                      </h3>
                      <div className='space-y-5'>
                        <Suspense fallback={t('loading')}>
                          <Countries locale={locale} />
                        </Suspense>
                        <Regions />
                        <Years />
                      </div>
                    </div>

                    <div data-tutorial='sidebar-step-2' className={STEP_CARD_CLASS}>
                      <h3 className='font-display font-extrabold text-[18px] tracking-tight mb-3.5 flex items-center gap-2 leading-none'>
                        <span>
                          {t('step2.titleStart')}
                          <em className='font-serif italic font-normal'>{t('step2.titleEmphasis')}</em>
                        </span>
                        <span className='ml-auto shrink-0 font-mono text-[10px] font-bold uppercase bg-[var(--color-brand-yellow)] text-[var(--color-brand-ink)] px-1.5 py-0.5 rounded-[5px] tracking-[0.08em]'>
                          {t('step2.badge', { step: 2 })}
                        </span>
                      </h3>
                      <div className='space-y-3'>
                        <PtoDays />
                      </div>
                    </div>

                    <div data-tutorial='sidebar-step-3' className={STEP_CARD_CLASS}>
                      <h3 className='font-display font-extrabold text-[18px] tracking-tight mb-3.5 flex items-center gap-2 leading-none'>
                        <span>
                          {t('step3.titleStart')}
                          <em className='font-serif italic font-normal'>{t('step3.titleEmphasis')}</em>
                        </span>
                        <span className='ml-auto shrink-0 font-mono text-[10px] font-bold uppercase bg-[var(--color-brand-yellow)] text-[var(--color-brand-ink)] px-1.5 py-0.5 rounded-[5px] tracking-[0.08em]'>
                          {t('step3.badge', { step: 3 })}
                        </span>
                      </h3>
                      <div className='space-y-5'>
                        <Strategy />
                        <AllowPastDays />
                        <CarryOverMonths />
                      </div>
                    </div>

                    <div data-tutorial='sidebar-step-4' className={STEP_CARD_CLASS}>
                      <h3 className='font-display font-extrabold text-[18px] tracking-tight mb-3.5 flex items-center gap-2 leading-none'>
                        <span>
                          {t('step4.titleStart')}
                          <em className='font-serif italic font-normal'>{t('step4.titleEmphasis')}</em>
                        </span>
                        <span className='ml-auto shrink-0 font-mono text-[10px] font-bold uppercase bg-[var(--color-brand-yellow)] text-[var(--color-brand-ink)] px-1.5 py-0.5 rounded-[5px] tracking-[0.08em]'>
                          {t('step4.badge', { step: 4 })}
                        </span>
                      </h3>
                      <CalendarExport />
                    </div>
                  </div>
                </SidebarCollapsibleGroup>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup className='rounded-[12px] bg-[var(--surface-panel-soft)] group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0'>
            <SidebarGroupLabel role='heading' aria-level={2}>
              {t('tools')}
            </SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarCollapsibleGroup
                  data-tutorial='sidebar-tools'
                  trigger={
                    <SidebarMenuButton variant='outline' tooltip={t('tools')}>
                      <AnimateIcon animateOnHover>
                        <Calculator className='h-5 w-5 shrink-0' />
                      </AnimateIcon>
                      <span className='group-data-[collapsible=icon]:hidden'>{t('calculators')}</span>
                      <ChevronDown className='ml-auto -rotate-90 transition-transform group-data-[open]/collapsible:rotate-0 group-data-[collapsible=icon]:hidden' />
                    </SidebarMenuButton>
                  }
                >
                  <div className='px-1 pt-2 pb-1 space-y-[18px]'>
                    <div className={STEP_CARD_CLASS}>
                      <PtoCalculator />
                    </div>
                    <div className={STEP_CARD_CLASS}>
                      <PtoSalaryCalculator />
                    </div>
                    <div className={STEP_CARD_CLASS}>
                      <WorkdayCounter />
                    </div>
                  </div>
                </SidebarCollapsibleGroup>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooterButtons />
      </Sidebar>
      <SidebarInset id='main-content' tabIndex={-1} className='outline-none'>
        <SidebarTrigger className={'cursor-pointer size-11 fixed m-3 z-51 p-1'} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
};
