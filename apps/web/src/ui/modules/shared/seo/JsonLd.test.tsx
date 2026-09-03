import { AMOUNT_MIN } from "@application/dto/payment/schema";
import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import { LOCALES } from "@infrastructure/i18n/locales";
import { render } from "@testing-library/react";
import { createTranslator, type Locale } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

const SITE_URL = "https://forever-pto.com";
const mockGetTranslations = vi.hoisted(() => vi.fn());

vi.mock("next-intl/server", () => ({ getTranslations: mockGetTranslations }));
vi.mock("@infrastructure/services/env/getPublicEnv", () => ({
	getPublicEnv: vi
		.fn()
		.mockResolvedValue({ siteUrl: "https://forever-pto.com", contactEmail: "hello@forever-pto.com" }),
}));

import { FaqJsonLd, JsonLd } from "./JsonLd";

const MESSAGES: Partial<Record<Locale, typeof enMessages>> = { en: enMessages, de: deMessages };

interface GetTranslationsParams {
	locale: Locale;
	namespace: "metadata" | "faq";
}

interface Schema {
	"@type": string;
	[key: string]: unknown;
}

const schemasOf = (container: HTMLElement): Schema[] =>
	[...container.querySelectorAll('script[type="application/ld+json"]')].map((script) =>
		JSON.parse(script.textContent ?? ""),
	);

const renderJsonLd = async (locale: Locale) => schemasOf(render(await JsonLd({ locale })).container);
const renderFaqJsonLd = async (locale: Locale) => schemasOf(render(await FaqJsonLd({ locale })).container)[0];

const answeredQuestions = (messages: typeof enMessages) =>
	Object.values(messages.faq.sections).flatMap((section) =>
		Object.values(section)
			.filter((entry): entry is { question: string; answer: string } => typeof entry === "object" && "answer" in entry)
			.map((entry) => entry.question),
	);

beforeEach(() => {
	vi.clearAllMocks();
	mockGetTranslations.mockImplementation(async ({ locale, namespace }: GetTranslationsParams) =>
		createTranslator({ locale, messages: MESSAGES[locale] ?? enMessages, namespace }),
	);
});

describe("JsonLd", () => {
	it("points the application at the planner under the locale's own prefix, none for the default", async () => {
		const [english] = await renderJsonLd("en");
		const [german] = await renderJsonLd("de");

		expect(english.url).toBe(`${SITE_URL}/planner`);
		expect(english.inLanguage).toBe("en");
		expect(german.url).toBe(`${SITE_URL}/de/planner`);
		expect(german.inLanguage).toBe("de");
	});

	it("advertises every locale the app ships as an available language", async () => {
		const [application] = await renderJsonLd("en");

		expect(application["@type"]).toBe("WebApplication");
		expect(application.availableLanguage).toEqual([...LOCALES]);
	});

	it("describes the application in the reader's language", async () => {
		const [application] = await renderJsonLd("de");

		expect(application.name).toBe(deMessages.metadata.title);
		expect(application.description).toBe(deMessages.metadata.description);
	});

	it("offers a free tier and a donation floor equal to the one the payment schema enforces", async () => {
		const [application] = await renderJsonLd("en");
		const [free, premium] = application.offers as { price?: string; priceSpecification?: Record<string, unknown> }[];

		expect(free.price).toBe("0");
		expect(premium.priceSpecification).toMatchObject({ minPrice: String(AMOUNT_MIN), priceCurrency: "EUR" });
	});

	it("emits the organisation with its logo hosted on the site itself", async () => {
		const [, organisation] = await renderJsonLd("en");

		expect(organisation).toEqual({
			"@context": "https://schema.org",
			"@type": "Organization",
			name: "Forever PTO",
			url: SITE_URL,
			logo: `${SITE_URL}/static/images/forever-pto-logo.png`,
		});
	});
});

describe("FaqJsonLd", () => {
	it("answers every question the bundle answers, leaving out the interactive troubleshooting one", async () => {
		const faq = await renderFaqJsonLd("en");
		const questions = (faq.mainEntity as { name: string }[]).map((question) => question.name);

		expect(faq["@type"]).toBe("FAQPage");
		expect(questions).toEqual(answeredQuestions(enMessages));
	});

	it("strips the link markup out of the answers, since a schema answer is plain text", async () => {
		const faq = await renderFaqJsonLd("en");
		const answers = (faq.mainEntity as { acceptedAnswer: { text: string } }[]).map(
			(question) => question.acceptedAnswer.text,
		);

		expect(answers.some((text) => text.includes("privacy policy"))).toBe(true);
		expect(answers.some((text) => text.includes("Open issues or merge requests"))).toBe(true);
		expect(answers.every((text) => !text.includes("<") && text.length > 0)).toBe(true);
	});

	it("asks the questions in the reader's language", async () => {
		const faq = await renderFaqJsonLd("de");
		const questions = (faq.mainEntity as { name: string }[]).map((question) => question.name);

		expect(questions).toEqual(answeredQuestions(deMessages));
		expect(questions[0]).not.toBe(enMessages.faq.sections.general.whatIsPto.question);
	});
});
