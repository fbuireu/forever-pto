import { cookies } from "next/headers";

export async function isPremium(): Promise<boolean> {
	const cookieStore = await cookies();

	return cookieStore.get("premium")?.value === "true";
}
