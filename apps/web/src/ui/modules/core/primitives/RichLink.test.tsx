import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@application/i18n/navigation", () => ({
	Link: ({ children, ...props }: ComponentProps<"a">) => (
		<a data-locale-aware="true" {...props}>
			{children}
		</a>
	),
}));

import { createRichLink, RichLink } from "./RichLink";

describe("RichLink", () => {
	it("routes an internal href through the locale-aware Link, so the prefix is never skipped", () => {
		render(<RichLink href="/premium">Go Premium</RichLink>);

		const link = screen.getByRole("link", { name: "Go Premium" });
		expect(link.dataset.localeAware).toBe("true");
		expect(link.getAttribute("href")).toBe("/premium");
		expect(link.getAttribute("target")).toBeNull();
	});

	it("opens an external href in a new tab without handing it the opener", () => {
		render(
			<RichLink href="https://stripe.com" external>
				Stripe
			</RichLink>,
		);

		const link = screen.getByRole("link", { name: "Stripe" });
		expect(link.dataset.localeAware).toBeUndefined();
		expect(link.getAttribute("target")).toBe("_blank");
		expect(link.getAttribute("rel")).toBe("noopener noreferrer");
	});

	it("styles as a primary underline link unless told otherwise", () => {
		render(<RichLink href="/a">A</RichLink>);

		expect(screen.getByRole("link").className).toBe("text-primary hover:underline");
	});

	it("replaces the default class rather than adding to it", () => {
		render(
			<RichLink href="/a" className="font-bold">
				A
			</RichLink>,
		);

		expect(screen.getByRole("link").className).toBe("font-bold");
	});
});

describe("createRichLink", () => {
	it("builds a rich-text tag that wraps whatever chunk the translation hands it", () => {
		const Tag = createRichLink({ href: "/faq" });

		render(Tag("the FAQ"));

		const link = screen.getByRole("link", { name: "the FAQ" });
		expect(link.getAttribute("href")).toBe("/faq");
		expect(link.className).toBe("text-primary hover:underline");
	});

	it("carries the external flag and the class through to the link", () => {
		const Tag = createRichLink({ href: "https://x.test", options: { external: true, className: "underline" } });

		render(Tag("out"));

		const link = screen.getByRole("link", { name: "out" });
		expect(link.getAttribute("target")).toBe("_blank");
		expect(link.className).toBe("underline");
	});
});
