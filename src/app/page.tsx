"use client";

import { Calendar } from "@/components/ui/calendar";
import { useMemo } from "react";
import { addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from "date-fns";
import "./globals.css";

export default function Home() {
    const monthsToShow = useMemo(() => {
        const today = new Date();
        const months = [];
        for (let i = 0; i < 11; i++) {
            months.push(addMonths(today, i));
        }
        return months;
    }, []);

    const getWeekendDays = (month:Date) => {
        const firstDay = startOfMonth(month);
        const lastDay = endOfMonth(month);
        return eachDayOfInterval({ start: firstDay, end: lastDay }).filter(isWeekend);
    };

    const getModifiers = (month: Date) => {
        const weekendDays = getWeekendDays(month);
        return {
            isWeekend: weekendDays,
        };
    };

    return (
            <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
                <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
                    <div className="flex flex-wrap gap-4">
                        {monthsToShow.map((month) => (
                                <div key={month.toISOString()}>
                                    <Calendar
                                            mode="single"
                                            className="rounded-md border shadow"
                                            defaultMonth={month}
                                            modifiers={getModifiers(month)}
                                            weekStartsOn={1}
                                            components={{
                                                IconRight: () => null,
                                                IconLeft: () => null,
                                                IconDropdown: () => null,
                                                // HeadRow: () => null,
                                                // Head: () => null,
                                            }}
                                            modifiersClassNames={{
                                                isWeekend: "rdp-day_weekend",
                                            }}
                                            classNames={{
                                                day_selected: "rdp-day_selected",
                                                day_outside: "rdp-day_outside",
                                            }}
                                    />
                                </div>
                        ))}
                    </div>
                </main>
                <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center"></footer>
            </div>
    );
}