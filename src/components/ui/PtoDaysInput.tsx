'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { startTransition, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export const PtoDaysInput = ({ availablePtoDays }) => {
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

    return <div className="flex items-center gap-2">
        <Label htmlFor="available-days" className="whitespace-nowrap">
            Tengo
        </Label>
        <Input
                id="available-days"
                type="number"
                defaultValue={availablePtoDays}
                onChange={(event) => {
                    startTransition(() => {
                        router.push(
                                pathname + '?' +
                                createQueryString('availablePtoDays', event.currentTarget.value),
                                { scroll: false });
                    });
                }}
                className="w-20"
                min="0"
        />
        <span>días libres</span>
    </div>;
};