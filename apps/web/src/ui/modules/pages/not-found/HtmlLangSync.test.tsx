import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HtmlLangSync } from "./HtmlLangSync";

const scriptOf = (locale: "de" | "en") => render(<HtmlLangSync locale={locale} />).container.querySelector("script");

afterEach(() => {
	document.documentElement.lang = "";
});

describe("HtmlLangSync", () => {
	it("emits an inline script that sets the document language as soon as it parses", () => {
		const script = scriptOf("de");

		expect(script?.textContent).toBe('document.documentElement.lang="de";');
		new Function(script?.textContent ?? "")();
		expect(document.documentElement.lang).toBe("de");
	});

	it("quotes the locale as JSON, so the value can never break out of the assignment", () => {
		expect(scriptOf("en")?.textContent).toBe(`document.documentElement.lang=${JSON.stringify("en")};`);
	});
});
