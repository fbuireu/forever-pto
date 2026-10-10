"use client";

import type { CountryDTO } from "@application/dto/country/types";
import { useRouter } from "@application/i18n/navigation";
import { useFiltersStore } from "@application/stores/filters";
import { QuickStartSource } from "@application/stores/ui";
import { track } from "@infrastructure/clients/logging/better-stack/tracking";
import { Button } from "@ui/modules/core/primitives/Button";
import { Combobox } from "@ui/modules/core/primitives/Combobox";
import { Label } from "@ui/modules/core/primitives/Label";
import { PLANNER_PATH } from "@ui/modules/shared/utils/helpers";
import { cn } from "@ui/utils/cn";
import { getUserCountryFromCookie } from "@ui/utils/userCountry";
import { useTranslations } from "next-intl";
import { type FormEvent, useCallback, useRef, useState } from "react";
import { PtoDaysCounter, YearChoice } from "./QuickStartPtoDaysStep";
import { startPlanning } from "./startPlanning";
import { canLeaveStep, createDraft, type QuickStartDraft, QuickStartStep, trackedDraft } from "./steps";

const COUNTRY_ID = "inline-quick-start-country";
const CONTROL_HEIGHT = "h-[52px]";
const CONTROL_ROW = cn("flex items-center", CONTROL_HEIGHT);

interface InlineQuickStartFormProps {
	countries: CountryDTO[];
	currentYear: number;
}

export const InlineQuickStartForm = ({ countries, currentYear }: InlineQuickStartFormProps) => {
	const t = useTranslations("quickStart");
	const tSidebar = useTranslations("sidebar");
	const router = useRouter();
	const [draft, setDraft] = useState<QuickStartDraft>(() =>
		createDraft({ filters: useFiltersStore.getState(), detectedCountry: getUserCountryFromCookie() }),
	);

	const hasReportedOpen = useRef(false);

	const updateDraft = useCallback((patch: Partial<QuickStartDraft>) => {
		if (!hasReportedOpen.current) {
			hasReportedOpen.current = true;
			track({ event: "quick_start_opened", properties: { source: QuickStartSource.INLINE } });
		}
		setDraft((previous) => ({ ...previous, ...patch }));
	}, []);

	const plan = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		startPlanning(draft);
		track({ event: "quick_start_completed", properties: { ...trackedDraft(draft), source: QuickStartSource.INLINE } });
		router.push(PLANNER_PATH);
	};

	return (
		<form
			onSubmit={plan}
			className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
		>
			<div className="space-y-2 min-w-0">
				<Label htmlFor={COUNTRY_ID} className="block">
					{t("location.country")}
				</Label>
				<Combobox
					id={COUNTRY_ID}
					className={cn("w-full", CONTROL_HEIGHT)}
					options={countries}
					value={draft.country}
					onChange={(country) => updateDraft({ country, region: "" })}
					placeholder={tSidebar("country.placeholder")}
					searchPlaceholder={tSidebar("country.search")}
				/>
			</div>
			<fieldset className="space-y-2">
				<legend className="text-sm font-medium leading-none mb-2">{t("steps.ptoDays")}</legend>
				<div className={CONTROL_ROW}>
					<PtoDaysCounter draft={draft} onChange={updateDraft} />
				</div>
			</fieldset>
			<YearChoice
				optionsClassName="grid grid-cols-4 items-center md:flex md:min-h-[52px]"
				currentYear={currentYear}
				draft={draft}
				onChange={updateDraft}
			/>
			<div className={CONTROL_ROW}>
				<Button
					type="submit"
					variant="accent"
					size="lg"
					className={cn("w-full lg:w-auto", CONTROL_HEIGHT)}
					disabled={!canLeaveStep({ step: QuickStartStep.LOCATION, draft })}
				>
					{t("finish")}
				</Button>
			</div>
		</form>
	);
};
