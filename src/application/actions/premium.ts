"use server";

import { PREMIUM_PARAMS } from "@const/const";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function isPremium(): Promise<boolean> {
	const cookieStore = await cookies();

	return cookieStore.get(PREMIUM_PARAMS.COOKIE_NAME)?.value === "true";
}

export async function activatePremium(path: string): Promise<void> {
	const cookieStore = await cookies();

	cookieStore.set({
		name: PREMIUM_PARAMS.COOKIE_NAME,
		value: "true",
		path: "/",
		maxAge: PREMIUM_PARAMS.DURATION,
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
	});

	revalidatePath(path);
}

export async function deactivatePremium(path: string): Promise<void> {
	const cookieStore = await cookies();

	cookieStore.delete({
		name: PREMIUM_PARAMS.COOKIE_NAME,
		path: "/",
	});

	revalidatePath(path);
}
