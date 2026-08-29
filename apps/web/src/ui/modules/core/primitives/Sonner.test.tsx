import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import { toast } from "sonner";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Toaster } from "./Sonner";

vi.mock("next-themes", () => ({ useTheme: () => ({ theme: "light" }) }));

const showToast = async (closeLabel?: string) => {
	render(<Toaster closeLabel={closeLabel} />);
	act(() => {
		toast.success("Plan applied");
	});
	await waitFor(() => expect(screen.getByText("Plan applied")).toBeDefined());
};

afterEach(() => {
	act(() => {
		toast.dismiss();
	});
});

describe("Toaster", () => {
	it("names the close button in the reader's language, which sonner otherwise hard-codes to English", async () => {
		await showToast("Cerrar notificación");

		expect(screen.getAllByRole("button", { name: "Cerrar notificación" }).length).toBeGreaterThan(0);
	});

	it("keeps sonner's own English wording when a caller passes nothing, so a forgetful caller loses nothing", async () => {
		await showToast();

		expect(screen.getAllByRole("button", { name: "Close toast" }).length).toBeGreaterThan(0);
	});
});
