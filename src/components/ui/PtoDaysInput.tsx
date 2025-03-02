'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { startTransition, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';

export const PtoDaysInput = ({ availablePtoDays }) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentValue = parseInt(availablePtoDays) || 0;

    const createQueryString = useCallback(
            (name: string, value: string) => {
                const params = new URLSearchParams(searchParams.toString());
                params.set(name, value);
                return params.toString();
            },
            [searchParams],
    );

    const decrementDays = () => {
        if (currentValue > 0) {
            const newValue = (currentValue - 1).toString();
            startTransition(() => {
                router.push(
                        pathname + '?' +
                        createQueryString('availablePtoDays', newValue),
                        { scroll: false },
                );
            });
        }
    };

    const incrementDays = () => {
        const newValue = (currentValue + 1).toString();
        startTransition(() => {
            router.push(
                    pathname + '?' +
                    createQueryString('availablePtoDays', newValue),
                    { scroll: false },
            );
        });
    };

    return <div className="flex items-center gap-2">
        <Label htmlFor="available-days" className="whitespace-nowrap">
            Tengo
        </Label>
        <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full"
                onClick={decrementDays}
                disabled={currentValue <= 0}
        >
            <Minus />
            <span className="sr-only">Increase</span>
        </Button>
        <Input
                id="available-days"
                type="number"
                value={currentValue}
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
        <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full"
                onClick={incrementDays}
        >
            <Plus />
            <span className="sr-only">Decrease</span>
        </Button>
        <span>días libres</span>
    </div>;
};