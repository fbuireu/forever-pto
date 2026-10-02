export const PLANNER_PATH = "/planner";

interface ApiErrorTranslator {
	(key: never, values: never): string;
	has: (key: never) => boolean;
	raw: (key: never) => unknown;
}

export type ApiErrorValues = ReadonlyMap<string, Record<string, number>>;

interface ResolveApiErrorMessageParams {
	code: string | null | undefined;
	t: ApiErrorTranslator;
	shared: ApiErrorTranslator;
	fallback: string;
	values?: ApiErrorValues;
}

const MACHINE_CODE = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

interface MessageFromParams {
	translator: ApiErrorTranslator;
	key: string;
	values: Record<string, number> | undefined;
}

const messageFrom = ({ translator, key, values }: MessageFromParams) => {
	if (!translator.has(key as never)) return undefined;

	if (typeof translator.raw(key as never) !== "string") return undefined;

	return translator(key as never, values as never);
};

export const resolveApiErrorMessage = ({ code, t, shared, fallback, values }: ResolveApiErrorMessageParams) => {
	if (!code) return fallback;

	const codeValues = values?.get(code);
	const message =
		messageFrom({ translator: t, key: `errors.${code}`, values: codeValues }) ??
		messageFrom({ translator: shared, key: code, values: codeValues });

	if (message !== undefined) return message;

	return MACHINE_CODE.test(code) ? fallback : code;
};

export const getViewBoxFromSvg = (svg: string) => {
	const VIEWBOX_REGEX = /viewBox="([^"]*)"/;
	const DEFAULT_VIEWBOX = "0 0 24 24";
	const viewBoxMatch = RegExp(VIEWBOX_REGEX).exec(svg);

	return viewBoxMatch ? viewBoxMatch[1] : DEFAULT_VIEWBOX;
};
