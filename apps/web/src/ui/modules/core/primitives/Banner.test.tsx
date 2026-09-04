import { render, screen } from "@testing-library/react";
import type { IconProps } from "@ui/modules/core/animate/icons/Icon";
import type { ComponentProps, ComponentType } from "react";
import { describe, expect, it } from "vitest";
import { Banner } from "./Banner";

type IconStubProps = { className?: string; "aria-hidden"?: ComponentProps<"svg">["aria-hidden"] };

const IconStub = ({ className, "aria-hidden": ariaHidden }: IconStubProps) => (
	<svg data-testid="banner-icon" className={className} aria-hidden={ariaHidden} />
);

const Icon = IconStub as ComponentType<IconProps<never>>;

const renderBanner = (overrides: Partial<ComponentProps<typeof Banner>> = {}) =>
	render(
		<Banner icon={Icon} title="Heads up" colorScheme="orange" {...overrides}>
			Your plan is out of date
		</Banner>,
	);

describe("Banner", () => {
	it("is a note landmark named by its title, so a reader can jump straight to it", () => {
		renderBanner();

		expect(screen.getByRole("note", { name: "Heads up" })).toBeDefined();
	});

	it("renders the message beside the title", () => {
		renderBanner();

		expect(screen.getByText("Your plan is out of date")).toBeDefined();
		expect(screen.getByText("Heads up")).toBeDefined();
	});

	it("hides the icon from assistive tech, since the title already says what it means", () => {
		renderBanner();

		expect(screen.getByTestId("banner-icon").getAttribute("aria-hidden")).toBe("true");
	});

	it("renders the action only when one is given", () => {
		renderBanner();
		expect(screen.queryByRole("button")).toBeNull();

		renderBanner({ action: <button type="button">Recalculate</button> });

		expect(screen.getByRole("button", { name: "Recalculate" })).toBeDefined();
	});

	it("paints the scheme it was asked for and none of the others", () => {
		renderBanner({ colorScheme: "green" });

		const note = screen.getByRole("note");
		expect(note.className).toContain("brand-green");
		expect(note.className).not.toContain("brand-orange");
	});

	it("appends the caller's className to the frame", () => {
		renderBanner({ className: "mt-4" });

		expect(screen.getByRole("note").className).toContain("mt-4");
	});
});
