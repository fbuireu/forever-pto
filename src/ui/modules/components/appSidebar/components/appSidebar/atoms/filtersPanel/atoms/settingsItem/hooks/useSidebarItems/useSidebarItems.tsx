import type { SearchParams } from '@const/types';

import {
	AllowPastDays,
} from '@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/allowPastDays/AllowPastDays';
import {
	AllowPasDaysInfoTooltip,
} from '@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/allowPastDays/atoms/allowPasDaysInfoTooltip/AllowPasDaysInfoTooltip';
import {
	CarryOverMonths,
} from '@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/carryOverMonths/CarryOverMonths';
import {
	CarryOverMonthsTooltip,
} from '@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/carryOverMonths/atoms/carryOverMonthsTooltip/CarryOverMonthsTooltip';
import {
	Countries,
} from '@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/countries/Countries';
import { PtoDays } from '@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/ptoDays/PtoDays';
import { Regions } from '@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/regions/Regions';
import { Years } from '@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/years/Years';
import type { SidebarItem } from '@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/types';
import { Calendar, CalendarDays, MapPin, MapPinned, ToggleLeftIcon } from 'lucide-react';
import { useMemo } from 'react';

export function useSidebarItems(params: SearchParams): SidebarItem[] {
  const { country, region, ptoDays, year, allowPastDays, carryOverMonths } = params;

  return useMemo(
      () => [
        {
          id: 'pto-days',
          title: 'PTO days',
          icon: CalendarDays,
          renderComponent: () => <PtoDays ptoDays={ptoDays} />,
        },
        {
          id: 'country',
          title: 'Country',
          icon: MapPin,
          renderComponent: () => <Countries country={country} />,
        },
        {
          id: 'region',
          title: 'Region',
          icon: MapPinned,
          renderComponent: () => <Regions country={country} region={region} />,
        },
        {
          id: 'year',
          title: 'Year',
          icon: Calendar,
          renderComponent: () => <Years year={year} />,
        },
        {
          id: 'allow-past-days',
          title: 'Allow Past Days',
          icon: ToggleLeftIcon,
          renderComponent: () => <AllowPastDays allowPastDays={allowPastDays} />,
          renderTooltip: () => <AllowPasDaysInfoTooltip />,
        },
        {
          id: 'carry-over-months',
          title: 'Carry Over Months',
          icon: ToggleLeftIcon,
          renderComponent: () => <CarryOverMonths carryOverMonths={carryOverMonths} />,
          renderTooltip: () => <CarryOverMonthsTooltip />,
        },
      ],
      [country, region, ptoDays, year, allowPastDays, carryOverMonths],
  );
}
