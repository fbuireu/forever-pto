import { Badge } from "@modules/components/core/badge/Badge";
import { CardContent } from "@modules/components/core/card/atoms/cardContent/CardContent";
import { CardDescription } from "@modules/components/core/card/atoms/cardDescription/CardDescription";
import { CardHeader } from "@modules/components/core/card/atoms/cardHeader/CardHeader";
import { CardTitle } from "@modules/components/core/card/atoms/cardTitle/CardTitle";
import { Card } from "@modules/components/core/card/Card";
import type { LocaleKey } from "@ui/utils/i18n/getLocalizedDateFns/getLocalizedDateFns";
import { Calculator, Calendar, CheckCircle, Settings, Zap } from "lucide-react";
import { getTranslations } from "next-intl/server";

interface RoadmapProps {
	locale: LocaleKey;
}

export const Roadmap = async ({ locale }: RoadmapProps) => {
	const t = await getTranslations({ locale, namespace: "roadmap" });

	const roadmapItems = [
		{
			id: "current",
			title: t("sections.current.title"),
			description: t("sections.current.description"),
			status: "completed",
			icon: CheckCircle,
			features: [
				t("sections.current.features.multiStrategy"),
				t("sections.current.features.holidayOptimization"),
				t("sections.current.features.alternatives"),
				t("sections.current.features.multiCountry"),
			],
		},
		{
			id: "short-term",
			title: t("sections.shortTerm.title"),
			description: t("sections.shortTerm.description"),
			status: "in-progress",
			icon: Calculator,
			features: [
				t("sections.shortTerm.features.customWeekends"),
				t("sections.shortTerm.features.manualAdjustments"),
				t("sections.shortTerm.features.strategySelection"),
				t("sections.shortTerm.features.improvedUI"),
			],
		},
		{
			id: "mid-term",
			title: t("sections.midTerm.title"),
			description: t("sections.midTerm.description"),
			status: "planned",
			icon: Settings,
			features: [
				t("sections.midTerm.features.customScoring"),
				t("sections.midTerm.features.seasonPriorities"),
				t("sections.midTerm.features.dateRestrictions"),
				t("sections.midTerm.features.partialPto"),
			],
		},
		{
			id: "long-term",
			title: t("sections.longTerm.title"),
			description: t("sections.longTerm.description"),
			status: "future",
			icon: Zap,
			features: [
				t("sections.longTerm.features.aiOptimization"),
				t("sections.longTerm.features.travelIntegration"),
				t("sections.longTerm.features.teamCoordination"),
				t("sections.longTerm.features.mobileApp"),
			],
		},
	];

	const getStatusColor = (status: string) => {
		switch (status) {
			case "completed":
				return "bg-green-100 text-green-800 border-green-200";
			case "in-progress":
				return "bg-blue-100 text-blue-800 border-blue-200";
			case "planned":
				return "bg-yellow-100 text-yellow-800 border-yellow-200";
			case "future":
				return "bg-gray-100 text-gray-800 border-gray-200";
			default:
				return "bg-gray-100 text-gray-800 border-gray-200";
		}
	};

	const getStatusLabel = (status: string) => {
		switch (status) {
			case "completed":
				return t("status.completed");
			case "in-progress":
				return t("status.inProgress");
			case "planned":
				return t("status.planned");
			case "future":
				return t("status.future");
			default:
				return status;
		}
	};

	return (
		<section className="w-full max-w-6xl mx-auto">
			<div className="text-center mb-8">
				<h2 className="text-3xl font-bold mb-4">{t("title")}</h2>
				<p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("description")}</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
				{roadmapItems.map((item) => {
					const IconComponent = item.icon;
					return (
						<Card key={item.id} className="relative">
							<CardHeader>
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-3">
										<div className="p-2 rounded-lg bg-primary/10">
											<IconComponent className="h-5 w-5 text-primary" />
										</div>
										<div>
											<CardTitle className="text-xl">{item.title}</CardTitle>
											<Badge variant="outline" className={`mt-2 ${getStatusColor(item.status)}`}>
												{getStatusLabel(item.status)}
											</Badge>
										</div>
									</div>
								</div>
								<CardDescription className="mt-3">{item.description}</CardDescription>
							</CardHeader>
							<CardContent>
								<ul className="space-y-2">
									{item.features.map((feature) => (
										<li key={feature} className="flex items-start gap-2 text-sm">
											<div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
											<span className="text-muted-foreground">{feature}</span>
										</li>
									))}
								</ul>
							</CardContent>
						</Card>
					);
				})}
			</div>

			<Card className="mt-8 bg-primary/5 border-primary/20">
				<CardContent className="pt-6">
					<div className="text-center">
						<Calendar className="h-8 w-8 text-primary mx-auto mb-3" />
						<h3 className="text-lg font-semibold mb-2">{t("feedback.title")}</h3>
						<p className="text-sm text-muted-foreground max-w-md mx-auto">{t("feedback.description")}</p>
					</div>
				</CardContent>
			</Card>
		</section>
	);
};
