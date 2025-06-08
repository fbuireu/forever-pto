"use client";

import { Button } from "@modules/components/core/button/Button";
import { Calendar } from "@modules/components/core/calendar/Calendar";
import { Dialog } from "@modules/components/core/dialog/Dialog";
import { DialogContent } from "@modules/components/core/dialog/atoms/dialogContent/DialogContent";
import { DialogFooter } from "@modules/components/core/dialog/atoms/dialogFooter/DialogFooter";
import { DialogHeader } from "@modules/components/core/dialog/atoms/dialogHeader/DialogHeader";
import { DialogTitle } from "@modules/components/core/dialog/atoms/dialogTitle/DialogTitle";
import { Input } from "@modules/components/core/input/Input";
import { Label } from "@modules/components/core/label/Label";
import { getLocalizedDateFns } from "@ui/utils/i18n/getLocalizedDateFns/getLocalizedDateFns";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

interface AddHolidayModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (date: Date, name: string) => void;
}

export const AddHolidayModal = ({ isOpen, onClose, onSave }: AddHolidayModalProps) => {
	const [date, setDate] = useState<Date>(new Date());
	const [name, setName] = useState("");
	const locale = useLocale();
	const t = useTranslations("modals.add");

	const handleSave = () => {
		onSave(date, name);
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="date">{t("title")}</Label>
						<div className="flex items-center gap-2">
							<Calendar
								mode="single"
								selected={date}
								onSelect={(newDate) => newDate && setDate(newDate)}
								locale={getLocalizedDateFns(locale)}
								month={date}
							/>
							<div className="flex items-center gap-2 rounded-md border p-2">
								<CalendarIcon className="h-4 w-4" />
								<span>{format(date, "PPP", { locale: getLocalizedDateFns(locale) })}</span>
							</div>
						</div>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="name">{t("nameLabel")}</Label>
						<Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("placeholder")} />
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						{t("cancel")}
					</Button>
					<Button onClick={handleSave}>{t("save")}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
