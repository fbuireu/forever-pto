"use client";

import type { HolidayDTO } from "@application/dto/holiday/types";
import { formatDate } from "@application/shared/utils/dates";
import { useFiltersStore } from "@application/stores/filters";
import { useHolidaysStore } from "@application/stores/holidays";
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
import { Calendar, CalendarSelectionMode, type FromTo } from "@ui/modules/pages/planner/calendar/Calendar";
import { describeHolidayRefusal } from "@ui/modules/pages/planner/calendar/utils/refusals";
import { CalendarDays, Calendar as CalendarIcon, Edit } from "lucide-react";
import type { Locale } from "next-intl";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createHolidaySchema, type HolidayFormData } from "./schema";

interface EditHolidayModalProps {
	open: boolean;
	onClose: () => void;
	locale: Locale;
	holiday: HolidayDTO;
}

export const EditHolidayModal = ({ open, onClose, locale, holiday }: EditHolidayModalProps) => {
	const t = useTranslations("modals.editHoliday");
	const tA11y = useTranslations("a11y");
	const tAdd = useTranslations("modals.addHoliday");
	const tValidation = useTranslations("validation.holiday");
	const { year, carryOverMonths } = useFiltersStore();
	const { holidays, editHoliday, currentSelection, alternatives, suggestion } = useHolidaysStore();
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(holiday.date);
	const [isPending, startTransition] = useTransition();

	const holidaySchema = createHolidaySchema({
		nameRequired: tValidation("nameRequired"),
		nameMax: tValidation("nameMax"),
		invalidDate: tValidation("invalidDate"),
	});

	const form = useForm<HolidayFormData>({
		resolver: zodResolver(holidaySchema),
		mode: "onSubmit",
		defaultValues: {
			name: holiday.name,
			date: holiday.date,
		},
	});

	const handleClose = () => {
		form.reset();
		setSelectedDate(undefined);
		onClose();
	};

	const onSubmit = (data: HolidayFormData) => {
		startTransition(() => {
			try {
				if (!holiday) {
					toast.error(t("errorTitle"), {
						description: t("errorDescription"),
					});
					return;
				}

				if (data.date.getTime() === holiday.date.getTime() && data.name === holiday.name) {
					return;
				}

				const outcome = editHoliday({
					holidayId: holiday.id,
					updates: { name: data.name, date: data.date },
					locale,
					year,
					carryOverMonths,
				});

				if (!outcome.applied) {
					const formattedDate = formatDate({ date: data.date, locale, format: "MMMM d, yyyy" });
					const refusal = describeHolidayRefusal({ outcome, t: tAdd, formattedDate });

					if (refusal) toast.error(refusal.title, { description: refusal.description });
					else toast.error(t("errorTitle"), { description: t("errorDescription") });

					return;
				}

				toast.success(t("successTitle"), {
					description: t("successDescription", { name: data.name }),
				});

				handleClose();
			} catch (error) {
				void import("@infrastructure/clients/logging/better-stack/client").then(({ getBetterStackInstance }) => {
					getBetterStackInstance().logError("Error editing holiday", error, { component: "EditHolidayModal" });
				});
				toast.error(t("errorTitle"), {
					description: t("errorDescription"),
				});
			}
		});
	};

	const handleDateSelect = (date: Date | Date[] | FromTo | undefined) => {
		if (date instanceof Date) {
			setSelectedDate(date);
			form.setValue("date", date, { shouldValidate: true });
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-sm" closeLabel={tA11y("closeDialog")} initialFocus={false}>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Edit className="size-5 text-blue-500" />
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
									<FormLabel>{tAdd("nameLabel")}</FormLabel>
									<FormControl>
										<Input
											type="text"
											inputMode="text"
											placeholder={tAdd("namePlaceholder")}
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
									<FormLabel>{tAdd("dateLabel")}</FormLabel>
									<FormControl>
										<div className="border-[3px] border-[var(--frame)] rounded-[10px] p-3 shadow-[var(--shadow-brutal-xs)]">
											<Calendar
												mode={CalendarSelectionMode.SINGLE}
												month={holiday.date}
												showNavigation
												selected={selectedDate}
												onSelect={handleDateSelect}
												locale={locale}
												holidays={holidays}
												allowPastDays
												currentSelection={currentSelection}
												alternatives={alternatives}
												suggestion={suggestion}
												className="w-full"
												disabled={isPending}
											/>
											{selectedDate && (
												<div className="mt-3 p-2 bg-muted rounded text-sm align-items-center flex">
													<CalendarIcon className="size-4 inline mr-2" />
													{tAdd("selected")}: {formatDate({ date: selectedDate, locale, format: "EEEE, MMMM d, yyyy" })}
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
									<Edit className="size-4 mr-2" />
									{isPending ? t("submitting") : t("submit")}
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
