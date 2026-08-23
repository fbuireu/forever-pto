"use client";

import { logClientError } from "@application/shared/utils/clientLog";
import { formatDate } from "@application/shared/utils/dates";
import { useHolidaysStore } from "@application/stores/holidays";
import type { HolidayOutcome } from "@application/stores/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/modules/core/animate/base/Dialog";
import { Button } from "@ui/modules/core/primitives/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@ui/modules/core/primitives/Form";
import { Input } from "@ui/modules/core/primitives/Input";
import {
	Calendar,
	CalendarSelectionMode,
	type DayStates,
	type FromTo,
} from "@ui/modules/pages/planner/calendar/Calendar";
import { describeHolidayRefusal } from "@ui/modules/pages/planner/calendar/utils/refusals";
import { isSuggestion } from "@ui/modules/pages/planner/utils/modifiers";
import { CalendarDays, Calendar as CalendarIcon } from "lucide-react";
import type { Locale } from "next-intl";
import { useTranslations } from "next-intl";
import { type ReactNode, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { createHolidaySchema, type HolidayFormData } from "./schema";

export const HolidayFormMode = {
	ADD: "modals.addHoliday",
	EDIT: "modals.editHoliday",
} as const;

export type HolidayFormMode = (typeof HolidayFormMode)[keyof typeof HolidayFormMode];

interface HolidayFormModalProps {
	open: boolean;
	onClose: () => void;
	locale: Locale;
	mode: HolidayFormMode;
	icon: ReactNode;
	defaultValues?: Partial<HolidayFormData>;
	onCommit: (data: HolidayFormData) => HolidayOutcome | null;
	successDescription: (data: HolidayFormData, formattedDate: string) => string;
}

export const HolidayFormModal = ({
	open,
	onClose,
	locale,
	mode,
	icon,
	defaultValues,
	onCommit,
	successDescription,
}: HolidayFormModalProps) => {
	const t = useTranslations(mode);
	const tFields = useTranslations(HolidayFormMode.ADD);
	const tA11y = useTranslations("a11y");
	const tValidation = useTranslations("validation.holiday");
	const { holidays, currentSelection } = useHolidaysStore(
		useShallow((state) => ({
			holidays: state.holidays,
			currentSelection: state.currentSelection,
		})),
	);
	const dayStates = useMemo<DayStates>(() => ({ suggested: isSuggestion({ currentSelection }) }), [currentSelection]);
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(defaultValues?.date);
	const [isPending, startTransition] = useTransition();

	const form = useForm<HolidayFormData>({
		resolver: zodResolver(
			createHolidaySchema({
				nameRequired: tValidation("nameRequired"),
				nameMax: tValidation("nameMax"),
				invalidDate: tValidation("invalidDate"),
			}),
		),
		mode: "onSubmit",
		defaultValues: { name: defaultValues?.name ?? "", ...(defaultValues?.date && { date: defaultValues.date }) },
	});

	const handleClose = () => {
		form.reset();
		setSelectedDate(undefined);
		onClose();
	};

	const handleDateSelect = (date: Date | Date[] | FromTo | undefined) => {
		if (date instanceof Date) {
			setSelectedDate(date);
			form.setValue("date", date, { shouldValidate: true });
		}
	};

	const onSubmit = (data: HolidayFormData) => {
		startTransition(() => {
			try {
				const formattedDate = formatDate({ date: data.date, locale, format: "MMMM d, yyyy" });
				const outcome = onCommit(data);

				if (!outcome) return;

				if (!outcome.applied) {
					const refusal = describeHolidayRefusal({ outcome, t: tFields, formattedDate });

					if (refusal) toast.error(refusal.title, { description: refusal.description });
					else toast.error(t("errorTitle"), { description: t("errorDescription") });

					return;
				}

				toast.success(t("successTitle"), { description: successDescription(data, formattedDate) });
				handleClose();
			} catch (error) {
				logClientError({
					message: "Error committing holiday",
					error,
					context: { component: "HolidayFormModal", mode },
				});
				toast.error(t("errorTitle"), { description: t("errorDescription") });
			}
		});
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-sm" closeLabel={tA11y("closeDialog")} initialFocus={false}>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						{icon}
						{t("title")}
					</DialogTitle>
					<DialogDescription>
						<span className="block my-2">
							<CalendarDays className="size-4 inline mr-1" />
							{t("description")}
						</span>
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{tFields("nameLabel")}</FormLabel>
									<FormControl>
										<Input
											type="text"
											inputMode="text"
											placeholder={tFields("namePlaceholder")}
											autoComplete="off"
											disabled={isPending}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="date"
							render={() => (
								<FormItem>
									<FormLabel>{tFields("dateLabel")}</FormLabel>
									<FormControl>
										<div className="border-[3px] border-[var(--frame)] rounded-[10px] p-3 shadow-[var(--shadow-brutal-xs)]">
											<Calendar
												mode={CalendarSelectionMode.SINGLE}
												showNavigation
												selected={selectedDate}
												onSelect={handleDateSelect}
												locale={locale}
												holidays={holidays}
												allowPastDays
												dayStates={dayStates}
												className="w-full"
												disabled={isPending}
											/>
											{selectedDate && (
												<div className="mt-3 p-2 bg-muted rounded text-sm flex align-items-center">
													<CalendarIcon className="size-4 inline mr-2" />
													{tFields("selected")}:{" "}
													{formatDate({ date: selectedDate, locale, format: "EEEE, MMMM d, yyyy" })}
												</div>
											)}
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<DialogFooter>
							<div className="flex gap-2 pt-2">
								<Button type="submit" variant="success" className="flex-1" disabled={isPending}>
									{t("submitting") && isPending ? t("submitting") : t("submit")}
								</Button>
								<Button type="button" variant="destructive" onClick={handleClose} disabled={isPending}>
									{t("cancel")}
								</Button>
							</div>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
