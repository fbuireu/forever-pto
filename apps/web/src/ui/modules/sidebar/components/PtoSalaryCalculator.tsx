"use client";

import { track } from "@infrastructure/clients/logging/better-stack/tracking";
import { SlidingNumber } from "@ui/modules/core/animate/text/SlidingNumber";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@ui/modules/core/primitives/InputGroup";
import { NumberInput } from "@ui/modules/core/primitives/NumberInput";
import { ConditionalWrapper } from "@ui/modules/shared/ConditionalWrapper";
import { DEFAULT_CURRENCY, DEFAULT_CURRENCY_SYMBOL } from "@ui/utils/currencies";
import { Euro } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { SidebarFieldTooltip } from "./SidebarFieldLabel";

const WORKING_DAYS_PER_YEAR = 252;
const HOURS_PER_DAY = 8;
const SALARY_FRACTION_DIGITS = 2;
const UNUSED_DAYS_FRACTION_DIGITS = 2;
const DEFAULT_UNUSED_PTO_DAYS = 5;

const positive = (amount: number | null) => (amount !== null && amount > 0 ? amount : 0);

interface CurrencyNumberProps {
	value: number;
	decimalPlaces?: number;
	currencyPosition: "before" | "after";
	currencySymbol: string;
}

const CurrencyNumber = ({ value, decimalPlaces = 0, currencyPosition, currencySymbol }: CurrencyNumberProps) => (
	<ConditionalWrapper
		doWrap={currencyPosition === "after"}
		wrapper={(children) => (
			<>
				{children}
				{currencySymbol}
			</>
		)}
	>
		<ConditionalWrapper
			doWrap={currencyPosition === "before"}
			wrapper={(children) => (
				<>
					{currencySymbol}
					{children}
				</>
			)}
		>
			<SlidingNumber number={value} decimalPlaces={decimalPlaces} />
		</ConditionalWrapper>
	</ConditionalWrapper>
);

export const PtoSalaryCalculator = () => {
	const locale = useLocale();
	const t = useTranslations("ptoSalaryCalculator");
	const tA11y = useTranslations("a11y");
	const [annualSalaryValue, setAnnualSalaryValue] = useState<number | null>(null);
	const [unusedPTODaysValue, setUnusedPTODaysValue] = useState<number | null>(DEFAULT_UNUSED_PTO_DAYS);

	const currencyPosition = useMemo(() => {
		try {
			const formatted = new Intl.NumberFormat(locale, {
				style: "currency",
				currency: DEFAULT_CURRENCY,
			}).format(0);
			return formatted.startsWith(DEFAULT_CURRENCY_SYMBOL) ? ("before" as const) : ("after" as const);
		} catch {
			return "before" as const;
		}
	}, [locale]);

	const annualSalary = positive(annualSalaryValue);
	const unusedPTODays = unusedPTODaysValue ?? 0;

	const dailyRate = annualSalary / WORKING_DAYS_PER_YEAR;
	const unusedPTOValue = dailyRate * unusedPTODays;
	const normalHourlyRate = annualSalary / WORKING_DAYS_PER_YEAR / HOURS_PER_DAY;
	const workedDays = WORKING_DAYS_PER_YEAR + unusedPTODays;
	const effectiveHourlyRate = annualSalary / workedDays / HOURS_PER_DAY;
	const showResults = annualSalary > 0 && unusedPTODays >= 0;

	const reportFirstFigures = (willShowResults: boolean) => {
		if (willShowResults && !showResults) track({ event: "tool_used", properties: { tool: "ptoSalaryCalculator" } });
	};

	const handleSalaryChange = (value: number | null) => {
		setAnnualSalaryValue(value);
		reportFirstFigures(positive(value) > 0 && unusedPTODays >= 0);
	};

	const handleUnusedDaysChange = (value: number | null) => {
		setUnusedPTODaysValue(value);
		reportFirstFigures(annualSalary > 0 && (value ?? 0) >= 0);
	};

	return (
		<div className="space-y-2 w-full">
			<div className="flex gap-2 text-sm font-normal">
				<Euro size={16} /> {t("title")}
				<SidebarFieldTooltip label={t("tooltipLabel")} className="w-60">
					{t("tooltip")}
				</SidebarFieldTooltip>
			</div>

			<div className="space-y-2 w-full">
				<p className="text-xs text-muted-foreground">{t("annualSalary")}</p>
				<InputGroup>
					<InputGroupAddon>
						<InputGroupText>{DEFAULT_CURRENCY_SYMBOL}</InputGroupText>
					</InputGroupAddon>
					<NumberInput
						id="annualSalary"
						render={<InputGroupInput className="pl-2" />}
						locale={locale}
						roleDescription={tA11y("numberField")}
						maximumFractionDigits={SALARY_FRACTION_DIGITS}
						inputMode="numeric"
						autoComplete="off"
						min={0}
						step={1000}
						value={annualSalaryValue}
						onValueChange={handleSalaryChange}
						placeholder={t("annualSalaryPlaceholder", { amount: 50_000 })}
					/>
				</InputGroup>
			</div>

			<div className="space-y-2 w-full">
				<p className="text-xs text-muted-foreground">{t("unusedPtoDays")}</p>
				<InputGroup>
					<NumberInput
						id="unusedPTO"
						render={<InputGroupInput />}
						locale={locale}
						roleDescription={tA11y("numberField")}
						maximumFractionDigits={UNUSED_DAYS_FRACTION_DIGITS}
						min={0}
						max={50}
						inputMode="numeric"
						autoComplete="off"
						value={unusedPTODaysValue}
						onValueChange={handleUnusedDaysChange}
						placeholder={t("unusedPtoDaysPlaceholder", { days: DEFAULT_UNUSED_PTO_DAYS })}
					/>
				</InputGroup>
			</div>

			{showResults && (
				<div className="space-y-2 w-full bg-muted rounded-md p-3">
					<div className="space-y-2 w-full">
						<div className="text-xs">
							<span className="font-display font-medium text-unused-value">{t("valueOfUnusedPto")}</span>
							<div className="text-lg font-display font-bold text-unused-value flex items-center gap-1">
								<CurrencyNumber
									value={unusedPTOValue}
									decimalPlaces={0}
									currencyPosition={currencyPosition}
									currencySymbol={DEFAULT_CURRENCY_SYMBOL}
								/>
							</div>
							<p className="text-muted-foreground">{t("worthOfPaidVacation")}</p>
						</div>

						<div className="text-xs border-t pt-2">
							<span className="font-display font-medium">{t("yourDailyRate")}</span>
							<div className="text-sm font-display font-bold text-primary flex items-center gap-1">
								<CurrencyNumber
									value={dailyRate}
									decimalPlaces={0}
									currencyPosition={currencyPosition}
									currencySymbol={DEFAULT_CURRENCY_SYMBOL}
								/>
								<span className="text-muted-foreground">{t("perDay")}</span>
							</div>
						</div>

						<div className="text-xs">
							<span className="font-display font-medium">{t("yourHourlyRate")}</span>
							<div className="text-sm font-display font-bold flex items-center gap-1">
								<CurrencyNumber
									value={normalHourlyRate}
									decimalPlaces={2}
									currencyPosition={currencyPosition}
									currencySymbol={DEFAULT_CURRENCY_SYMBOL}
								/>
								<span className="text-muted-foreground">{t("perHour")}</span>
							</div>
							<p className="text-muted-foreground">{t("standardWorkingHours")}</p>
						</div>

						{unusedPTODays > 0 && (
							<>
								<div className="text-xs">
									<span className="font-display font-medium text-effective-rate">{t("effectiveHourlyRate")}</span>
									<div className="text-sm font-display font-bold text-effective-rate flex items-center gap-1">
										<CurrencyNumber
											value={effectiveHourlyRate}
											decimalPlaces={2}
											currencyPosition={currencyPosition}
											currencySymbol={DEFAULT_CURRENCY_SYMBOL}
										/>
										<span className="text-muted-foreground">{t("perHour")}</span>
									</div>
									<p className="text-muted-foreground">{t("whenWorkingExtraDays", { days: unusedPTODays })}</p>
								</div>

								<div className="bg-info-surface p-3 rounded text-xs">
									<p className="text-info-title font-display font-medium">{t("opportunityCost")}</p>
									<p className="text-info-text">
										{t.rich("opportunityCostDescription", {
											days: unusedPTODays,
											amount: (_chunks) => (
												<span className="inline-flex font-semibold">
													<CurrencyNumber
														value={unusedPTOValue}
														decimalPlaces={0}
														currencyPosition={currencyPosition}
														currencySymbol={DEFAULT_CURRENCY_SYMBOL}
													/>
												</span>
											),
										})}
									</p>
								</div>
							</>
						)}
					</div>
				</div>
			)}
		</div>
	);
};
