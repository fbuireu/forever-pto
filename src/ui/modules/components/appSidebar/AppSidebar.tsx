import { Calculator } from 'lucide-react';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { ChevronRight } from '@ui/components/animate/icons/chevron-right';
import { AnimateIcon } from '@ui/components/animate/icons/icon';
import { Settings } from '@ui/components/animate/icons/settings';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@ui/components/animate/base/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@ui/components/animate/base/sidebar';
import { Logo } from '../core/Logo';
import { AllowPastDays } from './components/AllowPastDays';
import { CarryOverMonths } from './components/CarryOverMonths';
import { Countries } from './components/Countries';
import { PtoDays } from './components/PtoDays';
import { SidebarFooterButtons } from './components/SidebarFooterButtons';

// Lazy-load components that pull in cmdk
const Regions = dynamic(() => import('./components/Regions').then((m) => m.Regions));
const Years = dynamic(() => import('./components/Years').then((m) => m.Years));
const Strategy = dynamic(() => import('./components/Strategy').then((m) => m.Strategy));
const PtoCalculator = dynamic(() => import('./components/PtoCalculator').then((m) => m.PtoCalculator));
const PtoSalaryCalculator = dynamic(() => import('./components/PtoSalaryCalculator').then((m) => m.PtoSalaryCalculator));
const WorkdayCounter = dynamic(() => import('./components/WorkdayCounter').then((m) => m.WorkdayCounter));

interface AppSidebarProps {
  children: React.ReactNode;
  locale: Locale;
}

export const AppSidebar = async ({ locale, children }: AppSidebarProps) => {
  const t = await getTranslations('sidebar');

  return (
    <SidebarProvider>
      <Sidebar collapsible='icon' variant='inset'>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <Logo />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel role='heading' aria-level={2}>
              {t('configuration')}
            </SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <Collapsible
                  defaultOpen
                  className='group/collapsible w-[--radix-popper-anchor-width]'
                  data-tutorial='sidebar-filters'
                >
                  <AnimateIcon animateOnHover>
                    <CollapsibleTrigger asChild className='cursor-pointer'>
                      <SidebarMenuButton variant='outline' tooltip={t('filters')}>
                        <Settings className='h-5 w-5 shrink-0' />
                        <span className='group-data-[collapsible=icon]:hidden'>{t('filters')}</span>
                        <ChevronRight className='ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden' />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  </AnimateIcon>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <PtoDays />
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <Suspense fallback={t('loading')}>
                          <Countries locale={locale} />
                        </Suspense>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <Regions />
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <Years />
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <Strategy />
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <AllowPastDays />
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <CarryOverMonths />
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel role='heading' aria-level={2}>
              {t('tools')}
            </SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <Collapsible
                  defaultOpen={false}
                  className='group/collapsible w-[--radix-popper-anchor-width]'
                  data-tutorial='sidebar-tools'
                >
                  <AnimateIcon animateOnHover>
                    <CollapsibleTrigger asChild className='cursor-pointer'>
                      <SidebarMenuButton variant='outline' tooltip={t('tools')}>
                        <Calculator className='h-5 w-5 shrink-0' />
                        <span className='group-data-[collapsible=icon]:hidden'>{t('calculators')}</span>
                        <ChevronRight className='ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden' />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  </AnimateIcon>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <PtoCalculator />
                      <SidebarMenuSubItem />
                    </SidebarMenuSub>
                    <SidebarMenuSub>
                      <PtoSalaryCalculator />
                      <SidebarMenuSubItem />
                    </SidebarMenuSub>
                    <SidebarMenuSub>
                      <WorkdayCounter />
                      <SidebarMenuSubItem />
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooterButtons />
        <SidebarRail />
      </Sidebar>
      <SidebarInset id='main-content' tabIndex={-1} className='outline-none'>
        <SidebarTrigger className={'cursor-pointer size-11 fixed m-3 z-51 p-1'} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
};

