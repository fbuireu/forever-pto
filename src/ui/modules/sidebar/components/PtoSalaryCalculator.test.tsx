import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@application/stores/ui", () => ({
	useUIStore: (selector: (state: unknown) => unknown) => selector({ currencySymbol: "€", currency: "EUR" }),
}));

vi.mock("next-intl", () => ({
	useLocale: () => "en",
	useTranslations: () => Object.assign((key: string) => key, { rich: (key: string) => key }),
}));

const { PtoSalaryCalculator } = await import("./PtoSalaryCalculator");

const renderCalculator = () => {
	const { container } = render(<PtoSalaryCalculator />);
	return container.querySelector<HTMLInputElement>("#annualSalary") as HTMLInputElement;
};

describe("PtoSalaryCalculator", () => {
	it("mounts the salary field controlled and empty", () => {
		expect(renderCalculator().value).toBe("");
	});

	it("lets the salary field be emptied again instead of pinning it to 0", async () => {
		const user = userEvent.setup();
		const input = renderCalculator();

		await user.type(input, "50000");
		expect(input.value).toBe("50000");

		await user.clear(input);

		expect(input.value).toBe("");
	});
});
