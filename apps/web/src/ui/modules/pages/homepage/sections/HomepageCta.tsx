import { QuickStartSource } from "@application/stores/ui";
import { QuickStartTrigger } from "@ui/modules/shared/QuickStartTrigger";
import { getTranslations } from "next-intl/server";
import { CtaShapesClient } from "./CtaShapesClient";

export const HomepageCta = async () => {
	const t = await getTranslations("homepage");

	return (
		<section className="px-7 py-24 bg-[var(--frame)] text-[var(--background)] border-t-[4px] border-[var(--frame)] relative overflow-hidden">
			<CtaShapesClient
				byeMonday={t("closing.shapes.byeMonday")}
				bossOff={t("closing.shapes.bossOff")}
				doNotDisturb={t("closing.shapes.doNotDisturb")}
				zeroRegrets={t("closing.shapes.zeroRegrets")}
			/>

			<div className="max-w-[900px] mx-auto text-center relative z-[2]">
				<h2 className="font-display font-semibold leading-none tracking-[-0.03em] mb-5 text-[clamp(40px,6vw,80px)]">
					{t.rich("closing.title", {
						em: (chunks) => <em className="font-serif italic text-[var(--accent)]">{chunks}</em>,
						br: () => <br />,
					})}
				</h2>
				<p className="text-[19px] opacity-85 mb-8">{t("closing.description")}</p>
				<QuickStartTrigger
					source={QuickStartSource.CLOSING}
					size="lg"
					className="shadow-[var(--shadow-brutal-btn-inverted)] hover:shadow-[var(--shadow-brutal-btn-inverted-hover)] active:shadow-[var(--shadow-brutal-btn-inverted-active)]"
				>
					{t("closing.cta")}
				</QuickStartTrigger>
			</div>
		</section>
	);
};
