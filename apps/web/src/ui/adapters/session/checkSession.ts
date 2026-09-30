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
