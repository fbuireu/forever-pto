"use client";

import { MIN_CARRY_OVER_MONTHS } from "@application/stores/filters";
import { PremiumFeatureId, PremiumOrigin } from "@application/stores/premium";
import { FilterStrategy } from "@domain/calendar/types";
import { MAX_CARRY_OVER_MONTHS } from "@domain/calendar/window";
import { Switch } from "@ui/modules/core/animate/base/Switch";
import { Slider } from "@ui/modules/core/primitives/Slider";
import { PremiumFeature } from "@ui/modules/premium/PremiumFeature";
import { MonthToggles } from "@ui/modules/shared/MonthToggles";
import { STRATEGY_ICONS } from "@ui/modules/shared/strategyIcons";
import { useTranslations } from "next-intl";
import type { QuickStartDraft } from "./steps";

const STRATEGY_CARD_CLASS =
	"flex w-full cursor-pointer items-start gap-3 rounded-[10px] border-[3px] border-(--frame) bg-(--surface-panel) p-3 text-left shadow-(--shadow-brutal-xs) transition-all duration-75 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-(--shadow-brutal-sm) peer-checked:bg-(--accent) peer-checked:text-(--color-brand-ink) peer-checked:[&_span]:text-(--color-brand-ink) peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2";

interface QuickStartSettingsStepProps {
	draft: Pick<QuickStartDraft, "strategy" | "preferredMonths" | "allowPastDays" | "carryOverMonths" | "year">;
	onChange: (patch: Partial<QuickStartDraft>) => void;
}

export const QuickStartSettingsStep = ({ draft, onChange }: QuickStartSettingsStepProps) => {
	const t = useTranslations("quickStart.settings");
	const tSidebar = useTranslations("sidebar");
	const { year, carryOverMonths, allowPastDays, preferredMonths } = draft;

	return (
		<div className="space-y-4">
			<fieldset className="space-y-2">
				<legend className="text-sm font-medium leading-none mb-2">{tSidebar("strategy.title")}</legend>
				<div className="grid gap-2">
					{Object.values(FilterStrategy).map((value) => {
						const Icon = STRATEGY_ICONS[value];
						const id = `quick-start-strategy-${value}`;

						return (
							<div key={value} className="flex">
								<input
									type="radio"
									id={id}
									name="quick-start-strategy"
									value={value}
									checked={draft.strategy === value}
									onChange={() => onChange({ strategy: value })}
									className="peer sr-only"
								/>
								<label htmlFor={id} className={STRATEGY_CARD_CLASS}>
									<Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
									<span className="flex flex-col gap-0.5">
										<span className="text-sm font-black">{tSidebar(`strategy.${value}.label`)}</span>
										<span className="text-xs text-muted-foreground">{tSidebar(`strategy.${value}.description`)}</span>
									</span>
								</label>
							</div>
						);
					})}
				</div>
			</fieldset>

			{draft.strategy === FilterStrategy.MAIN_VACATION && (
				<MonthToggles
					label={tSidebar("preferredMonths.title")}
					legendClassName="text-sm font-medium leading-none mb-2"
					planningWindow={{ year, carryOverMonths }}
					allowPastDays={allowPastDays}
					months={preferredMonths}
					onChange={(months) => onChange({ preferredMonths: months })}
				/>
			)}

			<p className="text-xs text-muted-foreground">{t("premiumHint")}</p>

			<div className="space-y-2">
				<p className="text-sm font-medium leading-none">{tSidebar("allowPastDays.title")}</p>
				<PremiumFeature feature={PremiumFeatureId.ALLOW_PAST_DAYS} origin={PremiumOrigin.QUICK_START}>
					<div className="flex w-full items-center gap-2">
						<Switch
							checked={draft.allowPastDays}
							aria-label={tSidebar("allowPastDays.title")}
							onCheckedChange={(allowPastDays) => onChange({ allowPastDays })}
						/>
						<p className="text-sm font-normal">
							{draft.allowPastDays ? tSidebar("allowPastDays.enabled") : tSidebar("allowPastDays.disabled")}
						</p>
					</div>
				</PremiumFeature>
			</div>

			<div className="space-y-2">
				<p className="text-sm font-medium leading-none">{tSidebar("carryOverMonths.title")}</p>
				<PremiumFeature feature={PremiumFeatureId.CARRY_OVER_MONTHS} origin={PremiumOrigin.QUICK_START}>
					<div className="flex w-full items-center gap-4">
						<p className="text-sm font-normal">{MIN_CARRY_OVER_MONTHS}</p>
						<Slider
							label={tSidebar("carryOverMonths.title")}
							value={[draft.carryOverMonths]}
							min={MIN_CARRY_OVER_MONTHS}
							max={MAX_CARRY_OVER_MONTHS}
							step={1}
							onValueChange={([carryOverMonths]) => onChange({ carryOverMonths })}
						/>
						<p className="w-6 text-right text-sm font-black tabular-nums" aria-live="polite">
							{draft.carryOverMonths}
						</p>
					</div>
				</PremiumFeature>
			</div>
		</div>
	);
};
