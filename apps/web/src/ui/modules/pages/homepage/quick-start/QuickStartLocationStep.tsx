"use client";

import type { CountryDTO } from "@application/dto/country/types";
import type { RegionDTO } from "@application/dto/region/types";
import { Combobox } from "@ui/modules/core/primitives/Combobox";
import { Label } from "@ui/modules/core/primitives/Label";
import { useTranslations } from "next-intl";
import type { QuickStartDraft } from "./steps";

const COUNTRY_ID = "quick-start-country";
const REGION_ID = "quick-start-region";

interface QuickStartLocationStepProps {
	countries: CountryDTO[];
	regions: RegionDTO[];
	draft: Pick<QuickStartDraft, "country" | "region">;
	onChange: (patch: Partial<QuickStartDraft>) => void;
}

export const QuickStartLocationStep = ({ countries, regions, draft, onChange }: QuickStartLocationStepProps) => {
	const t = useTranslations("quickStart.location");
	const tSidebar = useTranslations("sidebar");
	const hasRegions = regions.length > 0;

	return (
		<div className="space-y-5">
			<div className="space-y-2">
				<Label htmlFor={COUNTRY_ID}>{t("country")}</Label>
				<Combobox
					id={COUNTRY_ID}
					className="w-full"
					options={countries}
					value={draft.country}
					onChange={(country) => onChange({ country, region: "" })}
					placeholder={tSidebar("country.placeholder")}
					searchPlaceholder={tSidebar("country.search")}
				/>
				<p className="text-xs text-muted-foreground">{t("detected")}</p>
			</div>
			<div className="space-y-2">
				<Label htmlFor={REGION_ID}>
					{t("region")} <span className="font-normal text-muted-foreground">({t("optional")})</span>
				</Label>
				<Combobox
					id={REGION_ID}
					className="w-full"
					options={regions}
					value={draft.region}
					onChange={(region) => onChange({ region })}
					disabled={!draft.country || !hasRegions}
					placeholder={tSidebar("region.placeholder")}
					searchPlaceholder={tSidebar("region.search")}
				/>
				{draft.country && !hasRegions && <p className="text-xs text-muted-foreground">{t("noRegions")}</p>}
			</div>
		</div>
	);
};
