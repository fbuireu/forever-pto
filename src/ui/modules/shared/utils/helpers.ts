interface ApiErrorTranslator {
	has: (key: never) => boolean;
	raw: (key: never) => unknown;
}

interface ResolveApiErrorMessageParams {
	code: string | null | undefined;
	t: ApiErrorTranslator;
	fallback: string;
}

const MACHINE_CODE = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

export const resolveApiErrorMessage = ({ code, t, fallback }: ResolveApiErrorMessageParams) => {
	if (!code) return fallback;

	const key = `errors.${code}` as never;

	if (t.has(key)) {
		const message = t.raw(key);
		if (typeof message === "string") return message;
	}

	return MACHINE_CODE.test(code) ? fallback : code;
};

export const getViewBoxFromSvg = (svg: string) => {
	const VIEWBOX_REGEX = /viewBox="([^"]*)"/;
	const DEFAULT_VIEWBOX = "0 0 24 24";
	const viewBoxMatch = RegExp(VIEWBOX_REGEX).exec(svg);

	return viewBoxMatch ? viewBoxMatch[1] : DEFAULT_VIEWBOX;
};
