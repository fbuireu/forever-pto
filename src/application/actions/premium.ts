"use server";

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

const PREMIUM_COOKIE_NAME = "premium";
const PREMIUM_COOKIE_DURATION = 30 * 24 * 60 * 60;

export async function checkPremiumStatus(): Promise<boolean> {
	const cookieStore = await cookies();

	return cookieStore.get(PREMIUM_COOKIE_NAME)?.value === "true";
}

export async function activatePremium(path: string): Promise<void> {
	const cookieStore = await cookies();

	cookieStore.set({
		name: PREMIUM_COOKIE_NAME,
		value: "true",
		path: "/",
		maxAge: PREMIUM_COOKIE_DURATION,
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
	});

	revalidatePath(path);
}

export async function deactivatePremium(path: string): Promise<void> {
	const cookieStore = await cookies();

	cookieStore.delete({
		name: PREMIUM_COOKIE_NAME,
		path: "/",
	});

	revalidatePath(path);
}
