import { ACTIVATION_COOKIE } from "@application/dto/payment/types";
import type { PremiumSession } from "@application/dto/premium/schema";

const loadSchemas = () => import("@application/dto/premium/schema");

export async function verifyPremiumEmail(email: string) {
	const response = await fetch("/api/check-session", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email }),
		credentials: "include",
	});

	if (!response.ok) return null;
	const body: unknown = await response.json();
	const { premiumKeySchema } = await loadSchemas();
	return premiumKeySchema.validate(body) ? { premiumKey: body.premiumKey } : null;
}

export async function getExistingSession(): Promise<PremiumSession | null> {
	const response = await fetch("/api/check-session", { credentials: "include" });
	if (!response.ok) throw new Error(`check-session answered ${response.status}`);
	const body: unknown = await response.json();
	const { premiumSessionSchema, noPremiumSessionSchema } = await loadSchemas();
	if (premiumSessionSchema.validate(body)) return { premiumKey: body.premiumKey, email: body.email };
	if (noPremiumSessionSchema.validate(body)) return null;
	throw new Error("check-session answered an unrecognised body");
}

export function claimActivationProof(): boolean {
	if (typeof document === "undefined") return false;
	if (!document.cookie.split("; ").some((row) => row.startsWith(`${ACTIVATION_COOKIE}=`))) return false;

	const secure = location.protocol === "https:" ? "; secure" : "";
	// biome-ignore lint/suspicious/noDocumentCookie: the proof is spent in the same task that reads it, which the async Cookie Store API cannot promise
	document.cookie = `${ACTIVATION_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=strict${secure}`;
	return true;
}
