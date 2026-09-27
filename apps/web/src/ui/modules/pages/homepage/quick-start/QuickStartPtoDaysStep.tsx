"use client";

import { MAX_PTO_DAYS, MIN_PTO_DAYS } from "@application/stores/filters";
import { Counter } from "@ui/modules/core/animate/components/Counter";
import { cn } from "@ui/utils/cn";
import { useTranslations } from "next-intl";
import { CHOICE_CLASS } from "./choice";
import { type QuickStartDraft, yearOptions } from "./steps";

const YEAR_CHIP_CLASS = cn(CHOICE_CLASS, "inline-flex h-9 items-center px-3.5 text-sm font-black tracking-[0.01em]");

interface QuickStartPtoDaysStepProps {
	currentYear: number;
	draft: Pick<QuickStartDraft, "ptoDays" | "year">;
	onChange: (patch: Partial<QuickStartDraft>) => void;
}

export const QuickStartPtoDaysStep = ({ currentYear, draft, onChange }: QuickStartPtoDaysStepProps) => {
	const t = useTranslations("quickStart.ptoDays");
	const tPtoDays = useTranslations("ptoDays");
	const years = yearOptions({ currentYear, selectedYear: draft.year });

	const setPtoDays = (value: number) => {
		onChange({ ptoDays: Math.min(MAX_PTO_DAYS, Math.max(MIN_PTO_DAYS, value)) });
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-3">
				<p className="text-sm text-muted-foreground">{tPtoDays("iHave")}</p>
				<Counter
					number={draft.ptoDays}
					setNumber={setPtoDays}
					decrementLabel={tPtoDays("decrease")}
					incrementLabel={tPtoDays("increase")}
					label={tPtoDays("days").toUpperCase()}
					decrementButtonProps={{ disabled: draft.ptoDays <= MIN_PTO_DAYS }}
					incrementButtonProps={{ disabled: draft.ptoDays >= MAX_PTO_DAYS }}
				/>
			</div>
			<fieldset className="space-y-2">
				<legend className="text-sm font-medium leading-none mb-2">{t("year")}</legend>
				<div className="flex flex-wrap gap-2">
					{years.map((year) => {
						const id = `quick-start-year-${year}`;

						return (
							<div key={year} className="flex">
								<input
									type="radio"
									id={id}
									name="quick-start-year"
									value={year}
									checked={draft.year === year}
									onChange={() => onChange({ year })}
									className="peer sr-only"
								/>
								<label htmlFor={id} className={YEAR_CHIP_CLASS}>
									{year}
								</label>
							</div>
						);
					})}
				</div>
			</fieldset>
		</div>
	);
};
