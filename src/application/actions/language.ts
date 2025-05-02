"use server";

import { I18N_CONFIG } from "@const/const";
import { cookies } from "next/headers";

export async function getUserLocale() {
	return (await cookies()).get(I18N_CONFIG.cookieName)?.value;
}
