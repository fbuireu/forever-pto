'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { startTransition, useCallback } from 'react';

export const YearSelect = ({ year }) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const createQueryString = useCallback(
            (name: string, value: string) => {
                const params = new URLSearchParams(searchParams.toString());
                params.set(name, value);
                return params.toString();
            },
            [searchParams],
    );

    const handleYearChange = useCallback((value: string) => {
        startTransition(() => {
            router.push(
                    pathname + '?' + createQueryString('year', value),
                    { scroll: false },
            );
        });
    }, [router, pathname, createQueryString]);

    return <div className="flex items-center gap-2">
        <Label htmlFor="year-select" className="whitespace-nowrap">
            Año:
        </Label>
        <Select
                value={year.toString()}
                onValueChange={handleYearChange}
        >
            <SelectTrigger id="year-select" className="w-24">
                <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
                {[2024, 2025, 2026, 2027].map(yearOption => (
                        <SelectItem key={yearOption} value={yearOption.toString()}>
                            {yearOption}
                        </SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>;
};