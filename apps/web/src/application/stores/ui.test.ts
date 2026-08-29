import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useUIStore } from "./ui";

const INITIAL = {
	donatePopoverOpen: false,
	donatePopoverIsOpening: false,
};

beforeEach(() => {
	useUIStore.setState(INITIAL);
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

describe("donate popover", () => {
	it("initial state has popover closed", () => {
		const { donatePopoverOpen, donatePopoverIsOpening } = useUIStore.getState();
		expect(donatePopoverOpen).toBe(false);
		expect(donatePopoverIsOpening).toBe(false);
	});

	it("openDonatePopover sets open and isOpening to true", () => {
		useUIStore.getState().openDonatePopover();
		const { donatePopoverOpen, donatePopoverIsOpening } = useUIStore.getState();
		expect(donatePopoverOpen).toBe(true);
		expect(donatePopoverIsOpening).toBe(true);
	});

	it("openDonatePopover clears isOpening after the next tick", () => {
		useUIStore.getState().openDonatePopover();
		vi.runAllTimers();
		expect(useUIStore.getState().donatePopoverIsOpening).toBe(false);
		expect(useUIStore.getState().donatePopoverOpen).toBe(true);
	});

	it("closeDonatePopover sets both flags to false", () => {
		useUIStore.setState({ donatePopoverOpen: true, donatePopoverIsOpening: true });
		useUIStore.getState().closeDonatePopover();
		expect(useUIStore.getState().donatePopoverOpen).toBe(false);
		expect(useUIStore.getState().donatePopoverIsOpening).toBe(false);
	});

	it("setDonatePopoverOpen(true) opens and clears isOpening", () => {
		useUIStore.getState().setDonatePopoverOpen(true);
		expect(useUIStore.getState().donatePopoverOpen).toBe(true);
		expect(useUIStore.getState().donatePopoverIsOpening).toBe(false);
	});

	it("setDonatePopoverOpen(false) closes and clears isOpening", () => {
		useUIStore.setState({ donatePopoverOpen: true, donatePopoverIsOpening: true });
		useUIStore.getState().setDonatePopoverOpen(false);
		expect(useUIStore.getState().donatePopoverOpen).toBe(false);
		expect(useUIStore.getState().donatePopoverIsOpening).toBe(false);
	});

	it("clearDonatePopoverOpening clears isOpening without touching open", () => {
		useUIStore.setState({ donatePopoverOpen: true, donatePopoverIsOpening: true });
		useUIStore.getState().clearDonatePopoverOpening();
		expect(useUIStore.getState().donatePopoverOpen).toBe(true);
		expect(useUIStore.getState().donatePopoverIsOpening).toBe(false);
	});
});
