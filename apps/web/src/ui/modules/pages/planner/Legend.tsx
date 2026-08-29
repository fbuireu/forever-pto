"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@ui/modules/core/primitives/Card";
import { MODIFIERS_CLASS_NAMES } from "@ui/modules/pages/planner/calendar/utils/helpers";
import { cn } from "@ui/utils/cn";
import { useTranslations } from "next-intl";
import { useState } from "react";
import styles from "./legend.module.css";

interface LegendItemsProps {
	className?: string;
	itemClassName?: string;
}

export const LegendItems = ({ className, itemClassName }: LegendItemsProps) => {
	const t = useTranslations("legend");

	return (
		<div className={cn("flex flex-wrap justify-center gap-4 text-sm", className)}>
			<div className={cn("flex items-center", itemClassName)}>
				<div className={cn("mr-2 size-8", MODIFIERS_CLASS_NAMES.today)} />
				<span>{t("today")}</span>
			</div>
			<div className={cn("flex items-center", itemClassName)}>
				<div className={cn("mr-2 size-8", MODIFIERS_CLASS_NAMES.weekend)} />
				<span>{t("weekends")}</span>
			</div>
			<div className={cn("flex items-center", itemClassName)}>
				<div className={cn("mr-2 size-8", MODIFIERS_CLASS_NAMES.holiday)} />
				<span>{t("holidays")}</span>
			</div>
			<div className={cn("flex items-center", itemClassName)}>
				<div className={cn("mr-2 size-8", MODIFIERS_CLASS_NAMES.suggested)} />
				<span>{t("suggested")}</span>
			</div>
			<div className={cn("flex items-center", itemClassName)}>
				<div className={cn("mr-2 size-8", MODIFIERS_CLASS_NAMES.alternative, "animate-none")} />
				<span>{t("alternatives")}</span>
			</div>
			<div className={cn("flex items-center", itemClassName)}>
				<div className={cn("mr-2 size-8", MODIFIERS_CLASS_NAMES.manuallySelected)} />
				<span>{t("manual")}</span>
			</div>
			<div className={cn("flex items-center", itemClassName)}>
				<div className={cn("mr-2 size-8", MODIFIERS_CLASS_NAMES.custom)} />
				<span>{t("custom")}</span>
			</div>
		</div>
	);
};

const LEGEND_ITEMS_ID = "legend-items";

export const Legend = () => {
	const t = useTranslations("legend");
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<div className={cn(styles.sticky_container, "hidden md:block")}>
			<section className={cn(styles.section, isExpanded && styles.expanded)}>
				<Card className={styles.card}>
					<CardHeader className={styles.card_header}>
						<CardTitle className={styles.card_title}>{t("title")}</CardTitle>
						<button
							type="button"
							className={styles.toggle}
							aria-expanded={isExpanded}
							aria-controls={LEGEND_ITEMS_ID}
							onClick={() => setIsExpanded((expanded) => !expanded)}
						>
							{isExpanded ? t("hideLegend") : t("showLegend")}
						</button>
					</CardHeader>
					<CardContent id={LEGEND_ITEMS_ID} className={styles.card_content}>
						<LegendItems className={styles.items} itemClassName={styles.item} />
					</CardContent>
				</Card>
			</section>
		</div>
	);
};
