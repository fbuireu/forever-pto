"use client";

import { MAX_PTO_DAYS, MIN_PTO_DAYS } from "@application/stores/filters";
import { Counter } from "@ui/modules/core/animate/components/Counter";
import { useTranslations } from "next-intl";
import { type QuickStartDraft, yearOptions } from "./steps";

const YEAR_CHIP_CLASS =
	"cursor-pointer rounded-[8px] border-[3px] border-(--frame) bg-(--surface-panel) px-4 py-2 font-display text-sm font-black shadow-(--shadow-brutal-xs) transition-all duration-75 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-(--shadow-brutal-sm) peer-checked:bg-(--accent) peer-checked:text-(--color-brand-ink) peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2";

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
