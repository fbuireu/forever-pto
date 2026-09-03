import enMessages from "@i18n/messages/en.json";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { FormButtons } from "./FormButtons";

const labels = enMessages.formButtons;

const renderButtons = (props: Partial<ComponentProps<typeof FormButtons>> = {}) =>
	render(
		<NextIntlClientProvider locale="en" messages={enMessages}>
			<FormButtons pending={false} {...props} />
		</NextIntlClientProvider>,
	);

describe("FormButtons", () => {
	it("falls back to the shared labels when the form names none", () => {
		renderButtons({ onCancel: vi.fn() });

		expect(screen.getByRole("button", { name: labels.submit }).getAttribute("type")).toBe("submit");
		expect(screen.getByRole("button", { name: labels.cancel }).getAttribute("type")).toBe("button");
	});

	it("shows the loading label and freezes both buttons while a submission is in flight", () => {
		renderButtons({ onCancel: vi.fn(), pending: true });

		expect(screen.getByRole("button", { name: labels.processing })).toHaveProperty("disabled", true);
		expect(screen.getByRole("button", { name: labels.cancel })).toHaveProperty("disabled", true);
	});

	it("renders no cancel button without a handler, and none when asked to hide it", () => {
		const { unmount } = renderButtons();
		expect(screen.queryByRole("button", { name: labels.cancel })).toBeNull();
		unmount();

		renderButtons({ onCancel: vi.fn(), hideCancel: true });
		expect(screen.queryByRole("button", { name: labels.cancel })).toBeNull();
	});

	it("uses the form's own words and hands cancel back to it", () => {
		const onCancel = vi.fn();
		renderButtons({ onCancel, submitText: "Send", cancelText: "Never mind" });

		fireEvent.click(screen.getByRole("button", { name: "Never mind" }));

		expect(screen.getByRole("button", { name: "Send" })).toBeDefined();
		expect(onCancel).toHaveBeenCalledOnce();
	});
});
