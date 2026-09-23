type TrackEventName =
	| "payment_started"
	| "payment_completed"
	| "payment_failed"
	| "payment_activation_failed"
	| "promo_code_applied"
	| "premium_activated"
	| "upgrade_modal_opened"
	| "feature_unlocked"
	| "planner_generated"
	| "contact_form_submitted"
	| "quick_start_opened"
	| "quick_start_step_completed"
	| "quick_start_abandoned"
	| "quick_start_completed"
	| "donate_opened"
	| "payment_cancelled"
	| "planning_input_changed"
	| "calendar_day_toggled"
	| "alternative_applied"
	| "manual_changes_reset"
	| "custom_holiday_saved"
	| "custom_holiday_deleted"
	| "holiday_modal_opened"
	| "holiday_tab_changed"
	| "holiday_selection_changed"
	| "holidays_sorted"
	| "holidays_searched"
	| "calendar_exported"
	| "tutorial_started"
	| "language_changed"
	| "theme_changed"
	| "tool_used"
	| "contact_opened";

interface TrackProperties {
	[key: string]: unknown;
}

export interface TrackParams {
	event: TrackEventName;
	properties?: TrackProperties;
}

export const track = ({ event, properties }: TrackParams) => {
	if (globalThis.window === undefined) return;
	globalThis.window.betterstack?.("track", event, properties);
	globalThis.window.gtag?.("event", event, properties);
};

export type TrackingEnvironment = "production" | "development";

const DEVELOPMENT_HOSTS = ["localhost", "127.0.0.1"];

export const trackingEnvironment = (hostname: string): TrackingEnvironment =>
	DEVELOPMENT_HOSTS.includes(hostname) || hostname.endsWith(".workers.dev") ? "development" : "production";

export interface IdentifyUserParams {
	email: string;
	plan: "premium" | "free";
}

export const identifyUser = ({ email, plan }: IdentifyUserParams) => {
	if (globalThis.window === undefined) return;
	globalThis.window.betterstack?.("user", { email, plan });
	globalThis.window.gtag?.("set", "user_properties", { plan });
};
