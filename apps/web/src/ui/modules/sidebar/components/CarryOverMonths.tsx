"use client";

import { MAX_CARRY_OVER_MONTHS, MIN_CARRY_OVER_MONTHS, useFiltersStore } from "@application/stores/filters";
import { AnimateIcon } from "@ui/modules/core/animate/icons/Icon";
import { SlidersHorizontal } from "@ui/modules/core/animate/icons/SlidersHorizontal";
import { SlidingNumber } from "@ui/modules/core/animate/text/SlidingNumber";
import { Slider } from "@ui/modules/core/primitives/Slider";
import { PremiumFeature } from "@ui/modules/premium/PremiumFeature";
import { SidebarFieldLabel } from "@ui/modules/sidebar/components/SidebarFieldLabel";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

const MIN_VALUE = MIN_CARRY_OVER_MONTHS;
const MAX_VALUE = MAX_CARRY_OVER_MONTHS;
const DEBOUNCE_DELAY = 300;

export const CarryOverMonths = () => {
	const t = useTranslations("sidebar.carryOverMonths");
	const carryOverMonths = useFiltersStore((state) => state.carryOverMonths);
	const setCarryOverMonths = useFiltersStore((state) => state.setCarryOverMonths);
	const [localValue, setLocalValue] = useState(carryOverMonths);
	const timeoutRef = useRef<NodeJS.Timeout>(undefined);
	const prevCarryOverRef = useRef(carryOverMonths);

	if (prevCarryOverRef.current !== carryOverMonths) {
		prevCarryOverRef.current = carryOverMonths;
		setLocalValue(carryOverMonths);
	}

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	const handleChange = useCallback(
		(value: number[]) => {
			const newValue = value[0];

			setLocalValue(newValue);

			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			timeoutRef.current = setTimeout(() => {
				setCarryOverMonths(newValue);
			}, DEBOUNCE_DELAY);
		},
		[setCarryOverMonths],
	);

	return (
		<AnimateIcon animateOnHover>
			<div className="space-y-2 w-full pb-4">
				<SidebarFieldLabel
					icon={<SlidersHorizontal size={16} />}
					title={t("title")}
					tooltip={{ label: t("tooltipLabel"), content: t("tooltip") }}
				/>
				<PremiumFeature feature={t("title")}>
					<div className="flex gap-4 items-center w-full">
						<p className="font-normal text-sm">{MIN_VALUE}</p>
						<div className="relative flex-1">
							<Slider
								label={t("title")}
								value={[localValue]}
								max={MAX_VALUE}
								min={MIN_VALUE}
								step={1}
								onValueChange={handleChange}
							/>
							<SlidingNumber
								className="absolute -bottom-4 left-0 w-full flex justify-center font-normal text-sm"
								number={localValue}
								padStart
							/>
						</div>
						<p className="font-normal text-sm">{MAX_VALUE}</p>
					</div>
				</PremiumFeature>
			</div>
		</AnimateIcon>
	);
};
