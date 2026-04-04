import { Calculator } from 'lucide-react';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { ChevronRight } from 'src/components/animate-ui/icons/chevron-right';
import { AnimateIcon } from 'src/components/animate-ui/icons/icon';
import { Settings } from 'src/components/animate-ui/icons/settings';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from 'src/components/animate-ui/radix/collapsible';
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
} from 'src/components/animate-ui/radix/sidebar';
import { Logo } from '../core/Logo';
import { AllowPastDays } from './components/AllowPastDays';
import { CarryOverMonths } from './components/CarryOverMonths';
import { Countries } from './components/Countries';
import { PtoCalculator } from './components/PtoCalculator';
import { PtoDays } from './components/PtoDays';
import { PtoSalaryCalculator } from './components/PtoSalaryCalculator';
import { Regions } from './components/Regions';
import { SidebarFooterButtons } from './components/SidebarFooterButtons';
import { Strategy } from './components/Strategy';
import { WorkdayCounter } from './components/WorkdayCounter';
import { Years } from './components/Years';

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
                        <Settings className='h-5 w-5 shrink-0 data-[collapsed=true]:mr-0 data-[collapsed=false]:mr-2' />
                        <span className='data-[collapsed=true]:hidden'>{t('filters')}</span>
                        <ChevronRight className='ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90 data-[collapsed=true]:hidden' />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
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
                  </AnimateIcon>
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
                        <Calculator className='h-5 w-5 shrink-0 data-[collapsed=true]:mr-0 data-[collapsed=false]:mr-2' />
                        <span className='data-[collapsed=true]:hidden'>{t('calculators')}</span>
                        <ChevronRight className='ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90 data-[collapsed=true]:hidden' />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
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
                  </AnimateIcon>
                </Collapsible>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooterButtons />
        <SidebarRail />
      </Sidebar>
      <SidebarInset id='main-content' tabIndex={-1} className='outline-none'>
        <SidebarTrigger className={'cursor-pointer size-8 fixed m-3 bg-background z-51'} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
};
