"use client";

import type { CountryDTO } from "@application/dto/country/types";
import { useUIStore } from "@application/stores/ui";
import { Dialog, DialogContent } from "@ui/modules/core/animate/base/Dialog";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/react/shallow";
import { QuickStartForm } from "./QuickStartForm";

interface QuickStartDialogProps {
	countries: CountryDTO[];
	currentYear: number;
}

export const QuickStartDialog = ({ countries, currentYear }: QuickStartDialogProps) => {
	const tA11y = useTranslations("a11y");
	const { open, setOpen } = useUIStore(
		useShallow((state) => ({
			open: state.quickStartOpen,
			setOpen: state.setQuickStartOpen,
		})),
	);

	return (
		<Dialog open={open} onOpenChange={(isOpen) => setOpen(isOpen)}>
			<DialogContent closeLabel={tA11y("closeDialog")} className="sm:max-w-xl" initialFocus={false}>
				<QuickStartForm countries={countries} currentYear={currentYear} />
			</DialogContent>
		</Dialog>
	);
};
