import { ReactNode, Suspense } from 'react';
import { Badge } from '@/components/ui/badge';
import CountryCombobox from './CountryCombobox';
import RegionCombobox from './RegionCombobox';
import { PtoDaysInput } from '@/components/ui/PtoDaysInput';
import { YearSelect } from '@/components/ui/YearSelect';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchParams } from '@/app/page';

export type FiltersProps = SearchParams

export default function Filters({
  country,
  region,
  year,
  ptoDays,
  allowPastDays,
}: FiltersProps) {
  return (
      <header className="w-full flex flex-col gap-4 mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold">Optimizador de PTO</h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <Badge variant="outline">
              Días PTO disponibles: {ptoDays}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg">
          <PtoDaysInput ptoDays={ptoDays} />
          <div className="flex flex-col gap-1 w-full">
            <Suspense fallback={<Skeleton className="h-10 w-full animate-pulse bg-slate-200 rounded" /> as ReactNode}>
              <CountryCombobox country={country} />
            </Suspense>
            <p className="text-xs text-gray-500 pl-2">Inferred from your IP. Feel free to change it</p>
          </div>

          <div className="flex flex-col gap-1 w-full">
            <Suspense fallback={<Skeleton className="h-10 w-full animate-pulse bg-slate-200 rounded" /> as ReactNode}>
              <RegionCombobox country={country} region={region} />
            </Suspense>
          </div>
          <YearSelect year={year} />
        </div>

        <div className="flex items-center gap-2 bg-blue-50 p-3 rounded">
          {/* Contenido comentado */}
        </div>
      </header>
  );
}