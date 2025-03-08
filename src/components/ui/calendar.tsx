"use client";

import { buttonVariants } from '@/components/ui/button';
import { mergeClass } from '@/shared/ui/utils/mergeClass';
import type * as React from 'react';
import { DayPicker } from 'react-day-picker';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
	return (
		<DayPicker
			showOutsideDays={showOutsideDays}
			className={mergeClass("p-3", className)}
			classNames={{
				months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
				month: "space-y-4 text-center",
				caption: "flex justify-center pt-1 relative items-center",
				month_caption: "text-sm font-medium",
				nav: "hidden",
				nav_button: "hidden",
				nav_button_previous: "hidden",
				nav_button_next: "hidden",
				table: "w-full border-collapse space-y-1",
				weekdays: "flex",
				weekday: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
				week: "flex w-full mt-2",
				day: mergeClass(
					props.mode === "range"
						? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
						: "[&:has([aria-selected])]:rounded-md",
				),
				day_button: mergeClass(
					buttonVariants({ variant: "ghost" }),
					"h-8 w-8 p-0 font-normal aria-selected:opacity-100",
				),
				range_start: "day-range-start",
				range_end: "day-range-end",
				selected:
					"bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
				today: "bg-accent text-accent-foreground",
				outside: "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
				disabled: "text-muted-foreground opacity-50",
				range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
				hidden: "hidden",
				...classNames,
			}}
			{...props}
		/>
	);
}
Calendar.displayName = "Calendar";

export { Calendar };
