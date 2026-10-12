import { routing } from "@infrastructure/i18n/routing";
import { expect, test } from "./fixtures";
import { expectLocalizedNotFound, NOT_FOUND_BUNDLES } from "./notFound";

const DOTTED_PATH = "/missing.txt";
const HTML_LANG = /<html[^>]*\blang="([^"]*)"/;
const HEAD = /<head[^>]*>([\s\S]*?)<\/head>/;
const TITLE = /<title>([^<]*)<\/title>/;

test.describe("global-not-found", () => {
	test("answers a dotted path the proxy never sees with the default language's 404, inside the shell, from the server", async ({
		page,
	}) => {
		const locale = routing.defaultLocale;
		const html = await expectLocalizedNotFound({ page, path: DOTTED_PATH, locale });

		expect(html.match(HTML_LANG)?.[1]).toBe(locale);
		expect(html.match(HEAD)?.[1].match(TITLE)?.[1]).toBe(NOT_FOUND_BUNDLES[locale].metadata.notFound.title);
	});
});
