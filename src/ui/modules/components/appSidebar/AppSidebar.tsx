import { ChevronRight, Settings } from 'lucide-react';
import type { Locale } from 'next-intl';
import { Suspense } from 'react';
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
import { AllowPastDays } from './atoms/AllowPastDays';
import { CarryOverMonths } from './atoms/CarryOverMonths';
import { Countries } from './atoms/Countries';
import { PtoDays } from './atoms/PtoDays';
import { Regions } from './atoms/Regions';
import { Years } from './atoms/Years';
import { Strategy } from './atoms/Strategy';

interface AppSidebarProps {
  children: React.ReactNode;
  locale: Locale;
}

export const AppSidebar = ({ locale, children }: AppSidebarProps) => {
  return (
    <SidebarProvider>
      <Sidebar collapsible='icon' variant='sidebar'>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>LOGO</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Filters</SidebarGroupLabel>
            <SidebarMenu>
              <Collapsible defaultOpen className='group/collapsible w-[--radix-popper-anchor-width]'>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
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
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>Item 1</SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>Item 2</SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>Item 3</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <SidebarTrigger />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
};
