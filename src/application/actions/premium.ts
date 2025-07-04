"use server";

import { PREMIUM_PARAMS } from "@const/const";
import { database } from "@infrastructure/client/database";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function isPremium(): Promise<boolean> {
	const cookieStore = await cookies();
	const messageId = cookieStore.get(PREMIUM_PARAMS.COOKIE_NAME)?.value;

	if (!messageId) {
		return false;
	}

	try {
		const result = await database.execute({
			sql: "SELECT 1 FROM payments WHERE messageId = ? LIMIT 1",
			args: [messageId],
		});

		return result.rows.length > 0;
	} catch (_) {
		return false;
	}
}

export async function checkPremiumByEmail(email: string): Promise<{ isPremium: boolean; messageId?: string }> {
	try {
		const result = await database.execute({
			sql: "SELECT * FROM payments WHERE email = ?",
			args: [email],
		});

		if (result.rows.length > 0) {
			const messageIdIndex = result.columns.indexOf("messageId");
			const row = result.rows[0];

			return {
				isPremium: true,
				messageId: row[messageIdIndex] as string,
			};
		}

		return { isPremium: false };
	} catch (_) {
		return { isPremium: false };
	}
}

export async function activatePremium({ messageId, path }: { messageId: string; path: string }): Promise<void> {
	const cookieStore = await cookies();

	cookieStore.set({
		name: PREMIUM_PARAMS.COOKIE_NAME,
		value: messageId,
		path: "/",
		maxAge: PREMIUM_PARAMS.COOKIE_DURATION,
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
