interface ApiErrorTranslator {
	has: (key: never) => boolean;
	raw: (key: never) => unknown;
}

interface ResolveApiErrorMessageParams {
	code: string | null | undefined;
	t: ApiErrorTranslator;
	shared: ApiErrorTranslator;
	fallback: string;
}

const MACHINE_CODE = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

interface MessageFromParams {
	translator: ApiErrorTranslator;
	key: string;
}

const messageFrom = ({ translator, key }: MessageFromParams) => {
	if (!translator.has(key as never)) return undefined;

	const message = translator.raw(key as never);

	return typeof message === "string" ? message : undefined;
};

export const resolveApiErrorMessage = ({ code, t, shared, fallback }: ResolveApiErrorMessageParams) => {
	if (!code) return fallback;

	const message =
		messageFrom({ translator: t, key: `errors.${code}` }) ?? messageFrom({ translator: shared, key: code });

	if (message !== undefined) return message;

	return MACHINE_CODE.test(code) ? fallback : code;
};

export const getViewBoxFromSvg = (svg: string) => {
	const VIEWBOX_REGEX = /viewBox="([^"]*)"/;
	const DEFAULT_VIEWBOX = "0 0 24 24";
	const viewBoxMatch = RegExp(VIEWBOX_REGEX).exec(svg);

	return viewBoxMatch ? viewBoxMatch[1] : DEFAULT_VIEWBOX;
};
