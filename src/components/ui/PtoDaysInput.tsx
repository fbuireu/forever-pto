'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDebounce } from "@uidotdev/usehooks";
import { Minus, Plus } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { startTransition, useCallback, useEffect, useState } from 'react';

export const PtoDaysInput = ({ ptoDays = 22 }) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
        const [inputValue, setInputValue] = useState(parseInt(ptoDays) || 0);
        const debouncedValue = useDebounce(inputValue, 300);

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set(name, value);
            return params.toString();
        },
        [searchParams],
    );

    useEffect(() => {
        if (debouncedValue.toString() !== (searchParams.get('ptoDays') || '0')) {
            startTransition(() => {
                router.push(
                    pathname + '?' + createQueryString('ptoDays', debouncedValue.toString()),
                    { scroll: false }
                );
            });
        }
    }, [debouncedValue, createQueryString, pathname, router, searchParams]);

    const decrementDays = () => {
        if (inputValue > 0) {
            setInputValue(inputValue - 1);
        }
    };

    const incrementDays = () => {
        setInputValue(inputValue + 1);
    };

    const handleInputChange = (event) => {
        const newValue = parseInt(event.currentTarget.value);
        if (!isNaN(newValue) && newValue >= 0) {
            setInputValue(newValue);
        } else if (event.currentTarget.value === '') {
            setInputValue(0);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Label htmlFor="available-days" className="whitespace-nowrap">
                Tengo
            </Label>
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full"
                onClick={decrementDays}
                disabled={inputValue <= 0}
            >
                <Minus />
                <span className="sr-only">Decrease</span>
            </Button>
            <Input
                id="available-days"
                type="number"
                value={inputValue}
                onChange={handleInputChange}
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
                <span className="sr-only">Increase</span>
            </Button>
            <span>días libres</span>
        </div>
    );
};