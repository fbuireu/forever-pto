export const TUTORIAL_ANCHOR = {
	SIDEBAR_STEP_1: "sidebar-step-1",
	SIDEBAR_STEP_2: "sidebar-step-2",
	SIDEBAR_STEP_3: "sidebar-step-3",
	SIDEBAR_STEP_4: "sidebar-step-4",
	SIDEBAR_TOOLS: "sidebar-tools",
	PLANNER_DRAWER: "planner-drawer",
	ALTERNATIVES_MANAGER: "alternatives-manager",
	PTO_STATUS: "pto-status",
	HOLIDAYS_LIST: "holidays-list",
	CALENDAR_LIST: "calendar-list",
} as const;

export type TutorialAnchor = (typeof TUTORIAL_ANCHOR)[keyof typeof TUTORIAL_ANCHOR];

export const tutorialSelector = (anchor: TutorialAnchor) => `[data-tutorial="${anchor}"]`;
