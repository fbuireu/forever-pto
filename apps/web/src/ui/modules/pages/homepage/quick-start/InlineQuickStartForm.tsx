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
import { getUserCountryFromCookie } from "@ui/utils/userCountry";
import { useTranslations } from "next-intl";
import { type FormEvent, useCallback, useRef, useState } from "react";
import { QuickStartPtoDaysStep } from "./QuickStartPtoDaysStep";
import { startPlanning } from "./startPlanning";
import { canLeaveStep, createDraft, type QuickStartDraft, QuickStartStep, trackedDraft } from "./steps";

const COUNTRY_ID = "inline-quick-start-country";

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
			className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end"
		>
			<div className="space-y-2">
				<Label htmlFor={COUNTRY_ID}>{t("location.country")}</Label>
				<Combobox
					id={COUNTRY_ID}
					className="w-full"
					options={countries}
					value={draft.country}
					onChange={(country) => updateDraft({ country, region: "" })}
					placeholder={tSidebar("country.placeholder")}
					searchPlaceholder={tSidebar("country.search")}
				/>
			</div>
			<QuickStartPtoDaysStep currentYear={currentYear} draft={draft} onChange={updateDraft} />
			<Button
				type="submit"
				variant="accent"
				size="lg"
				disabled={!canLeaveStep({ step: QuickStartStep.LOCATION, draft })}
			>
				{t("finish")}
			</Button>
		</form>
	);
};
