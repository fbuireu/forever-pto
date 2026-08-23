import { getFormatter, getTranslations } from "next-intl/server";

const PLANS_GENERATED = 12_000;

export const Stats = async () => {
	const [t, format] = await Promise.all([getTranslations("homepage"), getFormatter()]);

	return (
		<section className="px-7 pb-24">
			<div className="max-w-[1240px] mx-auto grid grid-cols-2 md:grid-cols-4 border-[4px] border-[var(--frame)] rounded-[14px] overflow-hidden bg-card shadow-[var(--shadow-brutal-xl)]">
				{[
					{ num: `${format.number(2.14)}×`, label: t("stats.efficiencyLabel"), bg: "var(--color-brand-yellow)" },
					{ num: format.number(47), label: t("stats.daysLabel", { days: 22 }), bg: "var(--color-brand-teal)" },
					{ num: format.number(203), label: t("stats.countriesLabel"), bg: "var(--color-brand-orange)" },
					{
						num: t("stats.plansValue", { value: format.number(PLANS_GENERATED, { notation: "compact" }) }),
						label: t("stats.plansLabel"),
						bg: "var(--color-brand-purple)",
					},
				].map(({ num, label, bg }) => (
					<div
						key={label}
						className="px-6 py-8 md:border-r-[4px] md:border-[var(--frame)] md:last:border-r-0 [contain:layout]"
						style={{ background: bg }}
					>
						<div className="font-display font-extrabold text-[56px] leading-none tracking-[-0.04em] mb-1.5 text-[var(--color-brand-ink)]">
							{num}
						</div>
						<div className="font-mono text-[13px] font-semibold text-[var(--color-brand-ink)]">{label}</div>
					</div>
				))}
			</div>
		</section>
	);
};
