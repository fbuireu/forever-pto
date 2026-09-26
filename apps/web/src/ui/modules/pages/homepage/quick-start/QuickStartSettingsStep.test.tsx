import { PremiumFeatureId, PremiumOrigin } from "@application/stores/premium";
import { FilterStrategy } from "@domain/calendar/types";
import { MAX_CARRY_OVER_MONTHS } from "@domain/calendar/window";
import enMessages from "@i18n/messages/en.json";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const gate = vi.hoisted(() => ({ features: [] as string[], origins: [] as (string | undefined)[] }));

vi.mock("@ui/modules/premium/PremiumFeature", () => ({
	PremiumFeature: ({ feature, origin, children }: { feature: string; origin?: string; children: ReactNode }) => {
		gate.features.push(feature);
		gate.origins.push(origin);
		return <div data-gated={feature}>{children}</div>;
	},
}));

import { QuickStartSettingsStep } from "./QuickStartSettingsStep";

const sidebar = enMessages.sidebar;

interface RenderStepParams {
	strategy?: FilterStrategy;
	allowPastDays?: boolean;
	carryOverMonths?: number;
}

const renderStep = ({
	strategy = FilterStrategy.GROUPED,
	allowPastDays = false,
	carryOverMonths = 1,
}: RenderStepParams = {}) => {
	const onChange = vi.fn();

	render(
		<NextIntlClientProvider locale="en" messages={enMessages}>
			<QuickStartSettingsStep draft={{ strategy, allowPastDays, carryOverMonths }} onChange={onChange} />
		</NextIntlClientProvider>,
	);

	return onChange;
};

beforeEach(() => {
	gate.features = [];
	gate.origins = [];
});

describe("QuickStartSettingsStep", () => {
	it("offers every strategy with the draft's one checked", () => {
		renderStep({ strategy: FilterStrategy.BALANCED });

		expect(screen.getAllByRole("radio").map((radio) => (radio as HTMLInputElement).value)).toStrictEqual([
			FilterStrategy.GROUPED,
			FilterStrategy.OPTIMIZED,
			FilterStrategy.BALANCED,
			FilterStrategy.MAIN_VACATION,
		]);
		expect((screen.getByLabelText(new RegExp(sidebar.strategy.balanced.label)) as HTMLInputElement).checked).toBe(true);
	});

	it("hands back the strategy that was picked", () => {
		const onChange = renderStep();

		fireEvent.click(screen.getByLabelText(new RegExp(sidebar.strategy.optimized.label)));

		expect(onChange).toHaveBeenCalledExactlyOnceWith({ strategy: FilterStrategy.OPTIMIZED });
	});

	it("gates past days and carry-over behind Premium, and nothing else", () => {
		renderStep();

		expect(gate.features).toStrictEqual([PremiumFeatureId.ALLOW_PAST_DAYS, PremiumFeatureId.CARRY_OVER_MONTHS]);
		expect(gate.origins).toStrictEqual([PremiumOrigin.QUICK_START, PremiumOrigin.QUICK_START]);
	});

	it("names the past-days switch itself and reports its state beside it", () => {
		const onChange = renderStep({ allowPastDays: true });

		expect(screen.getByText(sidebar.allowPastDays.enabled)).toBeDefined();
		fireEvent.click(screen.getByRole("switch", { name: sidebar.allowPastDays.title }));

		expect(onChange).toHaveBeenCalledExactlyOnceWith({ allowPastDays: false });
	});

	it("bounds the carry-over slider to the planning window and hands back a plain number", () => {
		const onChange = renderStep({ carryOverMonths: 3 });
		const slider = screen.getByRole("slider", { name: sidebar.carryOverMonths.title }) as HTMLInputElement;

		expect(slider.min).toBe("1");
		expect(slider.max).toBe(String(MAX_CARRY_OVER_MONTHS));
		expect(slider.value).toBe("3");
		fireEvent.change(slider, { target: { value: "6" } });

		expect(onChange).toHaveBeenCalledExactlyOnceWith({ carryOverMonths: 6 });
	});
});
