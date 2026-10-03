import { getCurrentYear } from "@ui/utils/getCurrentYear";
import { getTranslations } from "next-intl/server";
import { SiteTitleYear } from "./SiteTitleYear";

export const SiteTitle = async () => {
	const [t, serverYear] = await Promise.all([getTranslations("planner"), getCurrentYear()]);
	return (
		<div className="flex items-center flex-col justify-center mt-8 gap-5">
			<h1 className="font-display font-semibold text-[clamp(42px,6vw,72px)] leading-none tracking-[-0.04em] flex items-baseline gap-3">
				<span>{t("heading")}</span>
				<SiteTitleYear serverYear={serverYear} />
			</h1>
			<p className="font-display font-semibold text-[clamp(28px,4vw,52px)] leading-none tracking-[-0.03em] flex items-center gap-4 flex-wrap justify-center">
				{t.rich("titleHighlight", {
					first: (chunks) => (
						<span
							className="inline-block bg-[var(--accent)] text-[var(--color-brand-ink)] px-3 pb-1 border-[4px] border-[var(--frame)] rounded-[10px] shadow-[var(--shadow-brutal-btn)]"
							style={{ transform: "rotate(-4deg)" }}
						>
							{chunks}
						</span>
					),
					second: (chunks) => (
						<span
							className="inline-block bg-[var(--color-brand-sky)] text-[var(--color-brand-ink)] px-3 pb-1 border-[4px] border-[var(--frame)] rounded-[10px] shadow-[var(--shadow-brutal-btn)]"
							style={{ transform: "rotate(4deg)" }}
						>
							{chunks}
						</span>
					),
				})}
			</p>
		</div>
	);
};
