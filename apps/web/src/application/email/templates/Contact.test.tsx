import { existsSync } from "node:fs";
import { join } from "node:path";
import { EMAIL_PALETTE } from "@application/email/palette";
import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";
import { ContactFormEmail } from "./Contact";

const PUBLIC_DIR = join(import.meta.dirname, "../../../../public");
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
if (!SITE_URL) throw new Error("vitest.config.ts sets NEXT_PUBLIC_SITE_URL for the unit suite");

const BASE_PROPS = {
	email: "alice@example.com",
	name: "Alice Smith",
	subject: "Hello there",
	message: "This is my message.",
	baseUrl: SITE_URL,
};

const getHtml = (props = BASE_PROPS) => render(ContactFormEmail(props));

const { brand, email: roles } = EMAIL_PALETTE;

const rgbOf = (hex: string) =>
	`rgb(${[1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16)).join(",")})`;

const declares = ({ html, declaration }: { html: string; declaration: string }) =>
	[`style="${declaration}`, `;${declaration}`].some((start) => html.includes(start));

const PAINTED_WITH_THE_PALETTE = [
	{ role: "the card", declaration: `background-color:${rgbOf(roles.card)}` },
	{ role: "the message box", declaration: `background-color:${rgbOf(roles.well)}` },
	{ role: "the card, the message box and the rule", declaration: `border-color:${rgbOf(roles.line)}` },
	{ role: "the heading and the field values", declaration: `color:${rgbOf(roles.ink)}` },
	{ role: "the message", declaration: `color:${rgbOf(roles.body)}` },
	{ role: "the message label", declaration: `color:${rgbOf(roles.strong)}` },
	{ role: "the field labels", declaration: `color:${rgbOf(roles.label)}` },
	{ role: "the subtitle and the footer", declaration: `color:${rgbOf(roles.muted)}` },
	{ role: "the spam note", declaration: `color:${rgbOf(roles.faint)}` },
	{ role: "the reply button's text", declaration: `color:${rgbOf(roles.inverse)}` },
	{ role: "the reply button", declaration: `background-color:${rgbOf(brand.teal)}` },
	{ role: "the links and the details border", declaration: `color:${rgbOf(brand.teal)}` },
];

describe("ContactFormEmail", () => {
	it("includes the preview text with name and subject", async () => {
		const html = await getHtml();
		expect(html).toContain("New contact form submission from Alice Smith: Hello there");
	});

	it("renders the sender name", async () => {
		const html = await getHtml();
		expect(html).toContain("Alice Smith");
	});

	it("renders a mailto link for the sender email", async () => {
		const html = await getHtml();
		expect(html).toContain("mailto:alice%40example.com");
	});

	it("renders the subject", async () => {
		const html = await getHtml();
		expect(html).toContain("Hello there");
	});

	it("renders the message body", async () => {
		const html = await getHtml();
		expect(html).toContain("This is my message.");
	});

	it("reply button links to mailto with subject prefixed Re:", async () => {
		const html = await getHtml();
		expect(html).toContain("mailto:alice%40example.com?subject=Re%3A%20Hello%20there");
	});

	it("logo src uses baseUrl", async () => {
		const html = await getHtml();
		expect(html).toContain(`${SITE_URL}/static/images/forever-pto-logo.png`);
	});

	it("logo src updates when baseUrl changes", async () => {
		const html = await getHtml({ ...BASE_PROPS, baseUrl: "https://staging.example.com" });
		expect(html).toContain("https://staging.example.com/static/images/forever-pto-logo.png");
	});

	it("points the logo at a file that exists under public/, rather than at a path the test restates", async () => {
		const html = await getHtml();
		const src = /src="([^"]*\.png)"/.exec(html)?.[1];

		expect(src).toBeDefined();
		expect(existsSync(join(PUBLIC_DIR, new URL(src ?? "https://example.com").pathname))).toBe(true);
	});

	it.each(PAINTED_WITH_THE_PALETTE)("draws $role with the palette's colour", async ({ declaration }) => {
		const html = await getHtml();

		expect(declares({ html, declaration })).toBe(true);
	});

	it("paints nothing with a colour the palette does not hold", async () => {
		const html = await getHtml();
		const held = new Set(
			[
				...Object.values(brand),
				...Object.values(roles).flatMap((role) => (typeof role === "string" ? [role] : Object.values(role))),
			].map(rgbOf),
		);
		const painted = new Set(html.match(/rgb\(\d+,\d+,\d+\)/g));

		expect(painted.size).toBeGreaterThan(8);
		expect([...painted].filter((colour) => !held.has(colour))).toEqual([]);
	});

	it("does not let a crafted subject add headers to the reply", async () => {
		const html = await getHtml({ ...BASE_PROPS, subject: "Hi&bcc=victim@example.com&body=drained" });
		const replyHref = /href="(mailto:[^"]*\?subject=[^"]*)"/.exec(html)?.[1];

		expect(replyHref).not.toContain("&amp;");
		expect(replyHref).toBe(
			"mailto:alice%40example.com?subject=Re%3A%20Hi%26bcc%3Dvictim%40example.com%26body%3Ddrained",
		);
	});
});
