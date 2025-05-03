"use client";

import type { SearchParams } from "@const/types";
import { createQueryString } from "@modules/components/appSidebar/components/appSidebar/utils/createQueryString/createQueryString";
import { Label } from "@modules/components/core/label/Label";
import { Switch } from "@modules/components/core/switch/Switch";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useCallback, useMemo, useState } from "react";

export interface AllowPastDaysProps {
	allowPastDays: SearchParams["allowPastDays"];
}

export const AllowPastDays = ({ allowPastDays }: AllowPastDaysProps) => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isEnabled, setIsEnabled] = useState(allowPastDays === "true");

	const handleSwitchChange = useCallback(
		(checked: boolean) => {
			setIsEnabled(checked);

			const query = createQueryString({
				type: "allowPastDays",
				value: String(checked),
				searchParams,
			});

			startTransition(() => router.push(`${pathname}?${query}`, { scroll: false }));
		},
		[pathname, router, searchParams],
	);

	const labelText = useMemo(() => (isEnabled ? "Activado" : "Desactivado"), [isEnabled]);

	const switchControl = useMemo(
		() => (
			<div className="flex items-center gap-2">
				<Switch id="allow-past-days" checked={isEnabled} onCheckedChange={handleSwitchChange} />
				<Label htmlFor="allow-past-days" className="text-sm cursor-pointer select-none">
					{labelText}
				</Label>
			</div>
		),
		[isEnabled, handleSwitchChange, labelText],
	);

	return <div className="flex items-center justify-between">{switchControl}</div>;
};
