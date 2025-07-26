"use client";

import type { SearchParams } from "@const/types";
import { Label } from "@modules/components/core/label/Label";
import { Switch } from "@modules/components/core/switch/Switch";
import { useFilterAction } from "@ui/hooks/useFilterAction/useFilterAction";
import { useTranslations } from "next-intl";
import { useCallback, useId, useMemo } from "react";

export interface AllowPastDaysProps {
	allowPastDays: SearchParams["allowPastDays"];
}

export const AllowPastDays = ({ allowPastDays }: AllowPastDaysProps) => {
	const id = useId();
	const { updateFilter, isPending } = useFilterAction();
	const t = useTranslations("filters.allowPastDays");

	const isEnabled = allowPastDays === "true";

	const handleSwitchChange = useCallback(
		(checked: boolean) => {
			updateFilter("allowPastDays", String(checked));
		},
		[updateFilter],
	);

	const labelText = useMemo(() => (isEnabled ? t("enabled") : t("disabled")), [isEnabled, t]);

	const switchControl = useMemo(
		() => (
			<div className="flex items-center gap-2">
				<Switch id={id} checked={isEnabled} onCheckedChange={handleSwitchChange} disabled={isPending} />
				<Label htmlFor={id} className="text-sm cursor-pointer select-none">
					{labelText}
				</Label>
			</div>
		),
		[isEnabled, handleSwitchChange, labelText, id, isPending],
	);

	return <div className={`flex items-center justify-between ${isPending ? "opacity-50" : ""}`}>{switchControl}</div>;
};
