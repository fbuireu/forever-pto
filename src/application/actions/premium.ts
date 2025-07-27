"use server";

import { PREMIUM_PARAMS } from "@const/const";
import { database } from "@infrastructure/client/database";
import { jwtVerify, SignJWT } from "jose";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key");
const JWT_ALGORITHM = "HS256";

interface PremiumTokenPayload {
	messageId: string;
	email?: string;
	exp: number;
}

export async function generatePremiumToken(messageId: string, email?: string): Promise<string> {
	const payload: PremiumTokenPayload = {
		messageId,
		email,
		exp: Math.floor(Date.now() / 1000) + PREMIUM_PARAMS.COOKIE_DURATION,
	};

	return await new SignJWT(payload)
		.setProtectedHeader({ alg: JWT_ALGORITHM })
		.setIssuedAt()
		.setExpirationTime(payload.exp)
		.sign(JWT_SECRET);
}

export async function verifyPremiumToken(token: string): Promise<{ isValid: boolean; messageId?: string }> {
	try {
		const { payload } = await jwtVerify(token, JWT_SECRET);
		return {
			isValid: true,
			messageId: payload.messageId as string,
		};
	} catch {
		return { isValid: false };
	}
}

export async function isPremium(): Promise<boolean> {
	const cookieStore = await cookies();
	const token = cookieStore.get(PREMIUM_PARAMS.COOKIE_NAME)?.value;

	if (!token) {
		return false;
	}

	const { isValid } = await verifyPremiumToken(token);
	return isValid;
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
	const token = await generatePremiumToken(messageId);

	cookieStore.set({
		name: PREMIUM_PARAMS.COOKIE_NAME,
		value: token,
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
