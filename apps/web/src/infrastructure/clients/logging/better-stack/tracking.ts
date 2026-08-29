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
	| "contact_form_submitted";

interface TrackProperties {
	[key: string]: unknown;
}

export interface TrackParams {
	event: TrackEventName;
	properties?: TrackProperties;
}

export const track = ({ event, properties }: TrackParams) => {
	if (globalThis.window === undefined || !globalThis.window.betterstack) return;
	globalThis.window.betterstack("track", event, properties);
};

export interface IdentifyUserParams {
	email: string;
	plan: "premium" | "free";
}

export const identifyUser = ({ email, plan }: IdentifyUserParams) => {
	if (globalThis.window === undefined || !globalThis.window.betterstack) return;
	globalThis.window.betterstack("user", { email, plan });
};
