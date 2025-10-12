import { Calculator } from 'lucide-react';
import type { Locale } from 'next-intl';
import { Suspense } from 'react';
import { ChevronRight } from 'src/components/animate-ui/icons/chevron-right';
import { AnimateIcon } from 'src/components/animate-ui/icons/icon';
import { Settings } from 'src/components/animate-ui/icons/settings';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from 'src/components/animate-ui/radix/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import { LanguageSelector } from './components/LanguageSelector';
import { PtoCalculator } from './components/PtoCalculator';
import { PtoDays } from './components/PtoDays';
import { PtoSalaryCalculator } from './components/PtoSalaryCalculator';
import { Regions } from './components/Regions';
import { Strategy } from './components/Strategy';
import { ThemeSelector } from './components/ThemeSelector';
import { WorkdayCounter } from './components/WorkdayCounter';
import { Years } from './components/Years';

interface AppSidebarProps {
  children: React.ReactNode;
  locale: Locale;
}

export const AppSidebar = ({ locale, children }: AppSidebarProps) => (
  <SidebarProvider>
    <Sidebar collapsible='icon' variant='sidebar'>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
              <Logo />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Filters</SidebarGroupLabel>
          <SidebarMenu>
            <AnimateIcon animateOnHover>
              <Collapsible defaultOpen className='group/collapsible w-[--radix-popper-anchor-width]'>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild className='cursor-pointer'>
                    <SidebarMenuButton variant='outline' tooltip='Filters'>
                      <Settings className='h-5 w-5 shrink-0 data-[collapsed=true]:mr-0 data-[collapsed=false]:mr-2' />
                      <span className='data-[collapsed=true]:hidden'>Filters & Configuration</span>
                      <ChevronRight className='ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90 data-[collapsed=true]:hidden' />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <PtoDays />
                      <SidebarMenuSubItem />
                    </SidebarMenuSub>
                    <SidebarMenuSub>
                      <Suspense fallback={'Loading...'}>
                        <Countries locale={locale} />
                      </Suspense>
                      <SidebarMenuSubItem />
                    </SidebarMenuSub>
                    <SidebarMenuSub>
                      <Regions />
                      <SidebarMenuSubItem />
                    </SidebarMenuSub>
                    <SidebarMenuSub>
                      <Years />
                      <SidebarMenuSubItem />
                    </SidebarMenuSub>
                    <SidebarMenuSub>
                      <Strategy />
                      <SidebarMenuSubItem />
                    </SidebarMenuSub>
                    <SidebarMenuSub>
                      <AllowPastDays />
                      <SidebarMenuSubItem />
                    </SidebarMenuSub>
                    <SidebarMenuSub>
                      <CarryOverMonths />
                      <SidebarMenuSubItem />
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </AnimateIcon>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarMenu>
            <AnimateIcon animateOnHover>
              <Collapsible defaultOpen={false} className='group/collapsible w-[--radix-popper-anchor-width]'>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild className='cursor-pointer'>
                    <SidebarMenuButton variant='outline' tooltip='Tools'>
                      <Calculator className='h-5 w-5 shrink-0 data-[collapsed=true]:mr-0 data-[collapsed=false]:mr-2' />
                      <span className='data-[collapsed=true]:hidden'>Calculators</span>
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
                </SidebarMenuItem>
              </Collapsible>
            </AnimateIcon>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <LanguageSelector />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <ThemeSelector />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
    <SidebarInset>
      <SidebarTrigger className={'cursor-pointer size-6 fixed m-3'} />
      {children}
    </SidebarInset>
  </SidebarProvider>
);
