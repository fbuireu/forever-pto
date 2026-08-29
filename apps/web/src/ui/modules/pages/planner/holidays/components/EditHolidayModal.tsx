"use client";

import type { HolidayDTO } from "@application/dto/holiday/types";
import { useFiltersStore } from "@application/stores/filters";
import { useHolidaysStore } from "@application/stores/holidays";
import { Edit } from "lucide-react";
import type { Locale } from "next-intl";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/react/shallow";
import { HolidayFormModal, HolidayFormMode } from "./HolidayFormModal";

interface EditHolidayModalProps {
	open: boolean;
	onClose: () => void;
	locale: Locale;
	holiday: HolidayDTO;
}

export const EditHolidayModal = ({ open, onClose, locale, holiday }: EditHolidayModalProps) => {
	const t = useTranslations(HolidayFormMode.EDIT);
	const editHoliday = useHolidaysStore((state) => state.editHoliday);
	const { year, carryOverMonths } = useFiltersStore(
		useShallow((state) => ({ year: state.year, carryOverMonths: state.carryOverMonths })),
	);

	return (
		<HolidayFormModal
			open={open}
			onClose={onClose}
			locale={locale}
			mode={HolidayFormMode.EDIT}
			icon={<Edit className="size-5 text-primary" />}
			defaultValues={{ name: holiday.name, date: holiday.date }}
			onCommit={(data) => {
				const unchanged = data.date.getTime() === holiday.date.getTime() && data.name === holiday.name;
				if (unchanged) return null;

				return editHoliday({
					holidayId: holiday.id,
					updates: { name: data.name, date: data.date },
					year,
					carryOverMonths,
				});
			}}
			successDescription={(data) => t("successDescription", { name: data.name })}
		/>
	);
};
