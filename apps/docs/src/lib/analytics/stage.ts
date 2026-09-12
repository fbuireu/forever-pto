export type TrackingStage = "production" | "development";

const DEVELOPMENT_HOSTS = ["localhost", "127.0.0.1"];

export const trackingStage = (hostname: string): TrackingStage =>
	DEVELOPMENT_HOSTS.includes(hostname) || hostname.endsWith(".workers.dev") ? "development" : "production";
