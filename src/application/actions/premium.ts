"use server";

import { PREMIUM_COOKIE } from "@const/const";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function checkPremiumStatus(): Promise<boolean> {
	const cookieStore = await cookies();

	return cookieStore.get(PREMIUM_COOKIE.NAME)?.value === "true";
}

export async function activatePremium(path: string): Promise<void> {
	const cookieStore = await cookies();

	cookieStore.set({
		name: PREMIUM_COOKIE.NAME,
		value: "true",
		path: "/",
		maxAge: PREMIUM_COOKIE.DURATION,
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
	});

	revalidatePath(path);
}

export async function deactivatePremium(path: string): Promise<void> {
	const cookieStore = await cookies();

	cookieStore.delete({
		name: PREMIUM_COOKIE.NAME,
		path: "/",
	});

	revalidatePath(path);
}
