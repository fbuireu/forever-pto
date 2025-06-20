import type { SearchParams } from "@const/types";
import type { NextRequest } from "next/server";

export type RequiredParamsMap = {
	[K in keyof SearchParams]?: (request: NextRequest) => string | Promise<string>;
};
