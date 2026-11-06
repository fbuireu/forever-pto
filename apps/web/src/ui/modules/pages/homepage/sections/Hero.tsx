import { dayIndex, fromDayIndex, getWeekdayNames } from "@application/shared/utils/dates";
import { QuickStartSource } from "@application/stores/ui";
import { LOCALES, type LocaleCode } from "@infrastructure/i18n/locales";
import { Badge } from "@ui/modules/core/primitives/Badge";
import { Button } from "@ui/modules/core/primitives/Button";
import { FlagIcon } from "@ui/modules/core/primitives/FlagIcon";
import { EffectiveDaysBand } from "@ui/modules/pages/planner/calendar/EffectiveDaysBand";
import { MODIFIERS_CLASS_NAMES } from "@ui/modules/pages/planner/calendar/utils/helpers";
import { isEffectiveStretch } from "@ui/modules/pages/planner/utils/modifiers";
import { QuickStartTrigger } from "@ui/modules/shared/QuickStartTrigger";
import { cn } from "@ui/utils/cn";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { version } from "../../../../../../package.json";
import { CAL_ENTRIES, type DayType, SHOWCASE_EFFICIENCY, SHOWCASE_PLAN } from "./shared";

const LOCALE_FLAG: Partial<Record<LocaleCode, string>> = { en: "gb", ca: "es-ct" };

const HERO_DAY_CLASS: Record<DayType, string> = {
	work: "text-foreground",
	pto: MODIFIERS_CLASS_NAMES.suggested,
	holiday: MODIFIERS_CLASS_NAMES.holiday,
	weekend: MODIFIERS_CLASS_NAMES.weekend,
};

const entryOn = (date: Date) => CAL_ENTRIES[dayIndex(date)];

const inEffectiveStretch = isEffectiveStretch({
	isOff: (date) => {
		const type = entryOn(date)?.type;
		return type !== undefined && type !== "work";
	},
	isPlaced: (date) => entryOn(date)?.type === "pto",
});

const HERO_STRETCH = CAL_ENTRIES.map((_, position) => inEffectiveStretch(fromDayIndex(position)));

const SOCIAL_PROOF_RATING = 4.9;
const SOCIAL_PROOF_USERS = 12847;

export const Hero = async () => {
	const [t, tLegend, locale, format] = await Promise.all([
		getTranslations("homepage"),
		getTranslations("legend"),
		getLocale(),
		getFormatter(),
	]);
	const DAY_HEADERS = getWeekdayNames({ locale, weekStartsOn: 1 }).map((label, index) => ({
		id: `day-${index}`,
		label,
	}));

	return (
		<header className="relative px-7 pt-20 pb-24 overflow-hidden" id="hero">
			<div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-14 items-center">
				<div>
					<div className="flex gap-2.5 items-center mb-6 flex-wrap">
						<Badge variant="outline">
							<span className="flex items-center gap-1.5">
								{LOCALES.map((locale, i) => (
									<span key={locale} className="flex items-center gap-1">
										<FlagIcon code={LOCALE_FLAG[locale] ?? locale} />
										<span>{locale.toUpperCase()}</span>
										{i < LOCALES.length - 1 && <span className="opacity-40 mx-0.5">·</span>}
									</span>
								))}
							</span>
						</Badge>
						<Badge variant="outline">v{version}</Badge>
					</div>

					<h1 className="font-display font-semibold leading-[0.95] tracking-[-0.035em] mb-7 text-[clamp(48px,7vw,92px)]">
						{t.rich("hero.title", {
							br: () => <br />,
							highlight: (chunks) => (
								<span className="relative inline-block bg-[var(--accent)] text-[var(--color-brand-ink)] px-3 pb-1 border-[4px] border-[var(--frame)] rounded-[10px] shadow-[var(--shadow-brutal-btn)] mx-1 [animation:highlight-shake_4s_ease-in-out_infinite_1.5s]">
									{chunks}
								</span>
							),
						})}
						<span className="inline-block text-[0.75em] rotate-[15deg]">🌴</span>
					</h1>

					<p className="text-[21px] leading-[1.45] max-w-[540px] mb-8 text-foreground">
						{t.rich("hero.description", {
							em: (chunks) => <em className="font-serif font-normal italic text-[1.08em]">{chunks}</em>,
							strong: (chunks) => <strong>{chunks}</strong>,
						})}
					</p>

					<div className="flex gap-4 flex-wrap items-center mb-7">
						<QuickStartTrigger source={QuickStartSource.HERO} size="lg">
							{t("hero.plannerCta")}
						</QuickStartTrigger>
						<Button variant="outline" size="lg" asChild>
							<a href="#how">{t("hero.demoLink")}</a>
						</Button>
					</div>

					<div className="flex gap-2.5 items-center font-mono text-sm">
						<span className="text-star tracking-[2px] text-lg">★★★★★</span>
						<span>
							{t("hero.stars", {
								rating: format.number(SOCIAL_PROOF_RATING),
								users: format.number(SOCIAL_PROOF_USERS),
							})}
						</span>
					</div>
				</div>

				<div className="group">
					<div className="bg-card border-[5px] border-[var(--frame)] rounded-[14px] shadow-[var(--shadow-brutal-xl)] overflow-hidden rotate-[1.2deg] group-hover:rotate-0 transition-transform duration-[250ms] ease-out">
						<div className="flex items-center gap-2.5 px-4 py-[10px] bg-[var(--frame)]">
							<div className="size-3 rounded-full bg-[var(--color-brand-red)] border-[1.5px] border-shade" />
							<div className="size-3 rounded-full bg-[var(--color-brand-yellow)] border-[1.5px] border-shade" />
							<div className="size-3 rounded-full bg-[var(--color-brand-green)] border-[1.5px] border-shade" />
							<span className="ml-auto mr-auto font-mono text-[12px] text-on-fill/75">forever-pto.com / planner</span>
						</div>
						<div className="p-[22px] bg-card">
							<div className="grid grid-cols-2 gap-3.5 mb-4">
								{[
									{
										label: t("hero.mockupFieldPto"),
										value: <span>{SHOWCASE_PLAN.ptoDays}</span>,
										unit: t("hero.mockupFieldPtoUnit"),
									},
									{
										label: t("hero.mockupFieldCountry"),
										value: (
											<span className="flex items-center gap-1.5">
												<FlagIcon code={LOCALE_FLAG[locale] ?? locale} />
												<span>{locale.toUpperCase()}</span>
											</span>
										),
										unit: t("hero.mockupFieldHolidays", { count: SHOWCASE_PLAN.holidays }),
									},
								].map(({ label, value, unit }) => (
									<div
										key={label}
										className="border-[3px] border-[var(--frame)] rounded-[8px] px-3 py-2.5 bg-[var(--background)]"
									>
										<div className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground mb-1">
											{label}
										</div>
										<div className="font-display font-extrabold text-[28px] leading-none flex items-center gap-1">
											{value}
											<span className="text-[14px] font-semibold text-muted-foreground ml-1">{unit}</span>
										</div>
									</div>
								))}
							</div>
							<div className="px-[18px] pt-[18px] pb-4 bg-[var(--accent)] text-[var(--color-brand-ink)] border-[4px] border-[var(--frame)] rounded-[10px]">
								<div className="font-mono text-[12px] uppercase tracking-[0.1em] mb-1">{t("hero.mockupLabel")}</div>
								<div className="font-display font-extrabold text-[56px] leading-none tracking-[-0.03em] flex items-baseline gap-2.5">
									{SHOWCASE_PLAN.effectiveDays}
									<span className="text-[18px] font-semibold opacity-70">
										{t("hero.mockupRatio", { ratio: format.number(SHOWCASE_EFFICIENCY, { maximumFractionDigits: 2 }) })}
									</span>
								</div>
								<div className="mt-2 font-serif italic text-[18px]">{t("hero.mockupQuote")}</div>
							</div>

							<div className="mt-4 grid grid-cols-7 gap-2">
								{DAY_HEADERS.map(({ id, label }) => (
									<div
										key={id}
										className="py-1 text-center text-[0.68rem] font-black uppercase tracking-[0.08em] text-muted-foreground"
									>
										{label}
									</div>
								))}
								{CAL_ENTRIES.map(({ id, type }, position) => (
									<div key={id} className="relative isolate aspect-square">
										<EffectiveDaysBand stretch={HERO_STRETCH} position={position} />
										<div
											className={cn(
												"relative flex size-full items-center justify-center rounded-lg font-medium text-sm tabular-nums",
												HERO_DAY_CLASS[type],
												HERO_STRETCH[position] && type === "weekend" && "bg-transparent text-[var(--highlighter-ink)]",
											)}
										>
											{position + 1}
										</div>
									</div>
								))}
							</div>
							<div className="flex gap-x-4 gap-y-2 mt-3 flex-wrap">
								{(
									[
										{ type: "pto", label: t("hero.mockupLegendPto") },
										{ type: "holiday", label: t("hero.mockupLegendHoliday") },
										{ type: "weekend", label: t("hero.mockupLegendWeekend") },
									] as const
								).map(({ type, label }) => (
									<div key={label} className="flex items-center gap-2 text-[11px]">
										<div className={cn(HERO_DAY_CLASS[type], "size-8 shrink-0")} />
										<span>{label}</span>
									</div>
								))}
								<div className="flex items-center gap-2 text-[11px]">
									<div className="size-8 shrink-0 rounded-[11px] bg-highlighter" />
									<span>{tLegend("effective")}</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</header>
	);
};
