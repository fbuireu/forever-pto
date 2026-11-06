import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import { toast } from "sonner";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Toaster } from "./Sonner";

const nextTheme = vi.hoisted(() => ({ current: "light" }));

vi.mock("next-themes", () => ({ useTheme: () => ({ theme: nextTheme.current }) }));

const showToast = async (closeLabel = "Close toast"): Promise<void> => {
	render(<Toaster closeLabel={closeLabel} />);
	act(() => {
		toast.success("Plan applied");
	});
	await waitFor(() => expect(screen.getByText("Plan applied")).toBeDefined());
};

afterEach(() => {
	nextTheme.current = "light";
	act(() => {
		toast.dismiss();
	});
});

describe("Toaster", () => {
	it("names the close button in the reader's language, which sonner otherwise hard-codes to English", async () => {
		await showToast("Cerrar notificación");

		expect(screen.getAllByRole("button", { name: "Cerrar notificación" }).length).toBeGreaterThan(0);
	});
});

describe("Toaster theme", () => {
	const sonnerTheme = (): string | null =>
		document.querySelector("[data-sonner-toaster]")?.getAttribute("data-sonner-theme") ?? null;

	it("takes the theme next-themes reports when sonner knows it", async () => {
		nextTheme.current = "dark";
		await showToast();

		expect(sonnerTheme()).toBe("dark");
	});

	it("follows the system for a theme sonner does not know, rather than handing sonner a name it cannot style", async () => {
		nextTheme.current = "sepia";
		await showToast();

		expect(sonnerTheme()).toBe("light");
	});
});

describe("Toaster close button", () => {
	it("holds its hit area still while it lifts on hover", async () => {
		await showToast();
		const [close] = screen.getAllByRole("button", { name: "Close toast" });
		const classes = (close?.className ?? "").split(" ");

		expect(classes).toContain("hover:!-translate-x-0.5");
		expect(classes).toContain("hit-area-stable");
	});
});
