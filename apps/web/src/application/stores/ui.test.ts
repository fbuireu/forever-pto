import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useUIStore } from "./ui";

const INITIAL = {
	donatePopoverOpen: false,
	donatePopoverIsOpening: false,
	quickStartOpen: false,
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

describe("quick start", () => {
	it("starts closed", () => {
		expect(useUIStore.getState().quickStartOpen).toBe(false);
	});

	it("openQuickStart opens it", () => {
		useUIStore.getState().openQuickStart();
		expect(useUIStore.getState().quickStartOpen).toBe(true);
	});

	it("closeQuickStart closes it", () => {
		useUIStore.setState({ quickStartOpen: true });
		useUIStore.getState().closeQuickStart();
		expect(useUIStore.getState().quickStartOpen).toBe(false);
	});

	it("setQuickStartOpen mirrors the flag it is handed", () => {
		useUIStore.getState().setQuickStartOpen(true);
		expect(useUIStore.getState().quickStartOpen).toBe(true);
		useUIStore.getState().setQuickStartOpen(false);
		expect(useUIStore.getState().quickStartOpen).toBe(false);
	});

	it("leaves the donate popover alone", () => {
		useUIStore.setState({ donatePopoverOpen: true });
		useUIStore.getState().openQuickStart();
		expect(useUIStore.getState().donatePopoverOpen).toBe(true);
	});
});
