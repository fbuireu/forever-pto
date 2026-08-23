"use client";

import { useIsMobile } from "@ui/hooks/useMobile";
import { useSidebar } from "@ui/modules/core/animate/base/Sidebar";
import { AnimateIcon } from "@ui/modules/core/animate/icons/Icon";
import { X } from "@ui/modules/core/animate/icons/X";
import { TUTORIAL_ANCHOR, TUTORIAL_EVENT, tutorialSelector } from "@ui/modules/tutorial/anchors";
import type { DriveStep } from "driver.js";
import { useTranslations } from "next-intl";
import { useCallback, useEffect } from "react";

const FIRST_STEP_SELECTOR = tutorialSelector(TUTORIAL_ANCHOR.SIDEBAR_STEP_1);
const ANCHOR_MIN_FRAMES = 6;
const ANCHOR_STABLE_FRAMES = 3;
const ANCHOR_MAX_FRAMES = 90;

const measure = (selector: string) => {
	const element = document.querySelector(selector);
	if (!element) return null;
	const { x, y, width, height } = element.getBoundingClientRect();
	return `${Math.round(x)},${Math.round(y)},${Math.round(width)},${Math.round(height)}`;
};

const waitForAnchorToSettle = (selector: string) =>
	new Promise<void>((resolve) => {
		let frames = 0;
		let stableFrames = 0;
		let previous: string | null = null;

		const check = () => {
			frames++;
			const current = measure(selector);
			stableFrames = current !== null && current === previous ? stableFrames + 1 : 0;
			previous = current;

			const settled = frames >= ANCHOR_MIN_FRAMES && stableFrames >= ANCHOR_STABLE_FRAMES;
			if (settled || frames >= ANCHOR_MAX_FRAMES) {
				resolve();
				return;
			}

			requestAnimationFrame(check);
		};

		requestAnimationFrame(check);
	});

export const useTutorial = () => {
	const { open, openMobile, toggleSidebar } = useSidebar();
	const isMobile = useIsMobile();
	const t = useTranslations("tutorial.steps");
	const tUi = useTranslations("tutorial");

	const startTutorial = useCallback(async () => {
		const [{ getDriverClientInstance }] = await Promise.all([
			import("@infrastructure/clients/tutorial/driver/client"),
			import("@ui/modules/tutorial/DriverStyles"),
		]);
		const driverClient = getDriverClientInstance();

		const expandDrawer = () => globalThis.dispatchEvent(new CustomEvent(TUTORIAL_EVENT.EXPAND_DRAWER));
		const collapseDrawer = () => globalThis.dispatchEvent(new CustomEvent(TUTORIAL_EVENT.COLLAPSE_DRAWER));

		const steps: DriveStep[] = [
			{
				element: tutorialSelector(TUTORIAL_ANCHOR.SIDEBAR_STEP_1),
				popover: {
					title: t("step1Title"),
					description: t("step1Description"),
					side: "right",
					align: "start",
				},
			},
			{
				element: tutorialSelector(TUTORIAL_ANCHOR.SIDEBAR_STEP_2),
				popover: {
					title: t("step2Title"),
					description: t("step2Description"),
					side: "right",
					align: "start",
				},
			},
			{
				element: tutorialSelector(TUTORIAL_ANCHOR.SIDEBAR_STEP_3),
				popover: {
					title: t("step3Title"),
					description: t("step3Description"),
					side: "right",
					align: "start",
				},
			},
			{
				element: tutorialSelector(TUTORIAL_ANCHOR.SIDEBAR_STEP_4),
				popover: {
					title: t("step4Title"),
					description: t("step4Description"),
					side: "right",
					align: "start",
				},
			},
			{
				element: tutorialSelector(TUTORIAL_ANCHOR.SIDEBAR_TOOLS),
				popover: {
					title: t("toolsTitle"),
					description: t("toolsDescription"),
					side: "right",
					align: "start",
				},
			},
			...(isMobile
				? [
						{
							element: tutorialSelector(TUTORIAL_ANCHOR.PLANNER_DRAWER),
							popover: {
								title: t("drawerTitle"),
								description: t("drawerDescription"),
								side: "top" as const,
								align: "center" as const,
							},
						},
					]
				: []),
			{
				element: tutorialSelector(TUTORIAL_ANCHOR.ALTERNATIVES_MANAGER),
				popover: {
					title: t("alternativesTitle"),
					description: t("alternativesDescription"),
					side: "bottom",
					align: "start",
				},
				onHighlightStarted: isMobile ? expandDrawer : undefined,
			},
			{
				element: tutorialSelector(TUTORIAL_ANCHOR.PTO_STATUS),
				popover: {
					title: t("statusTitle"),
					description: t("statusDescription"),
					side: "bottom",
					align: "end",
				},
			},
			{
				element: tutorialSelector(TUTORIAL_ANCHOR.HOLIDAYS_LIST),
				popover: {
					title: t("holidaysListTitle"),
					description: t("holidaysListDescription"),
					side: "bottom",
					align: "start",
				},
			},
			{
				element: tutorialSelector(TUTORIAL_ANCHOR.CALENDAR_LIST),
				popover: {
					title: t("calendarTitle"),
					description: t("calendarDescription"),
					side: "top",
					align: "center",
				},
			},
			{
				popover: {
					title: t("finishTitle"),
					description: t("finishDescription"),
				},
			},
		];

		const isSidebarOpen = isMobile ? openMobile : open;

		if (!isSidebarOpen) {
			toggleSidebar();
			await waitForAnchorToSettle(FIRST_STEP_SELECTOR);
		}

		driverClient.start(steps, {
			closeIcon: (
				<AnimateIcon animateOnHover>
					<X className="size-4" />
				</AnimateIcon>
			),
			nextBtnText: tUi("nextBtn"),
			prevBtnText: tUi("prevBtn"),
			doneBtnText: tUi("doneBtn"),
			progressText: `{{current}} ${tUi("progressTextConnector")} {{total}}`,
			onDestroyStarted: isMobile ? collapseDrawer : undefined,
		});
	}, [open, openMobile, isMobile, t, tUi, toggleSidebar]);

	useEffect(() => {
		return () => {
			const destroyTour = async () => {
				try {
					const { getDriverClientInstance } = await import("@infrastructure/clients/tutorial/driver/client");
					getDriverClientInstance().destroy();
				} catch {}
			};

			void destroyTour();
		};
	}, []);

	return { startTutorial };
};
