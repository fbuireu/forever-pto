"use client";

import { useServerStore } from "@application/stores/server/serverStore";
import { Label } from "@modules/components/core/label/Label";
import { Switch } from "@modules/components/core/switch/Switch";
import { useTranslations } from "next-intl";
import { useCallback, useId, useMemo } from "react";

export const AllowPastDays = () => {
	const id = useId();
	const { allowPastDays, updateAllowPastDays } = useServerStore();
	const t = useTranslations("filters.allowPastDays");

	const isEnabled = allowPastDays === "true";

	const handleSwitchChange = useCallback(
		(checked: boolean) => {
			updateAllowPastDays(String(checked));
		},
		[updateAllowPastDays],
	);

	const labelText = useMemo(() => (isEnabled ? t("enabled") : t("disabled")), [isEnabled, t]);

	const switchControl = useMemo(
		() => (
			<div className="flex items-center gap-2">
				<Switch id={id} checked={isEnabled} onCheckedChange={handleSwitchChange} />
				<Label htmlFor={id} className="text-sm cursor-pointer select-none">
					{labelText}
				</Label>
			</div>
		),
		[isEnabled, handleSwitchChange, labelText, id],
	);

	return <div className="flex items-center justify-between">{switchControl}</div>;
};
