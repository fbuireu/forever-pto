"use client";

import type { CountryDTO } from "@application/dto/country/types";
import { useUIStore } from "@application/stores/ui";
import { track } from "@infrastructure/clients/logging/better-stack/tracking";
import { Dialog, DialogContent } from "@ui/modules/core/animate/base/Dialog";
import { useTranslations } from "next-intl";
import { useCallback, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { QuickStartForm } from "./QuickStartForm";
import { QuickStartStep } from "./steps";

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

	const stepRef = useRef<QuickStartStep>(QuickStartStep.LOCATION);
	const rememberStep = useCallback((step: QuickStartStep) => {
		stepRef.current = step;
	}, []);

	const handleOpenChange = (isOpen: boolean) => {
		if (!isOpen) {
			track({ event: "quick_start_abandoned", properties: { step: stepRef.current } });
		}
		setOpen(isOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent closeLabel={tA11y("closeDialog")} className="sm:max-w-xl" initialFocus={false}>
				<QuickStartForm countries={countries} currentYear={currentYear} onStepChange={rememberStep} />
			</DialogContent>
		</Dialog>
	);
};
