import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./Command";

const renderPalette = () => {
	const onSelect = vi.fn();
	const view = render(
		<Command>
			<CommandInput placeholder="Search a country" />
			<CommandList>
				<CommandEmpty>Nothing matches</CommandEmpty>
				<CommandGroup heading="Countries">
					<CommandItem value="spain" onSelect={onSelect}>
						Spain
					</CommandItem>
					<CommandItem value="france" onSelect={onSelect}>
						France
					</CommandItem>
				</CommandGroup>
			</CommandList>
		</Command>,
	);
	return { ...view, onSelect };
};

const options = () => screen.getAllByRole("option").map((option) => option.textContent);

describe("Command", () => {
	it("lists every item until something is typed", () => {
		renderPalette();

		expect(options()).toEqual(["Spain", "France"]);
		expect(screen.queryByText("Nothing matches")).toBeNull();
	});

	it("narrows the list to what matches the typed text", async () => {
		renderPalette();

		await userEvent.type(screen.getByPlaceholderText("Search a country"), "fra");

		expect(options()).toEqual(["France"]);
	});

	it("shows the empty message once nothing matches", async () => {
		renderPalette();

		await userEvent.type(screen.getByPlaceholderText("Search a country"), "zzz");

		expect(screen.queryAllByRole("option")).toHaveLength(0);
		expect(screen.getByText("Nothing matches")).toBeDefined();
	});

	it("hands the item's value, not its label, to onSelect when it is clicked", async () => {
		const { onSelect } = renderPalette();

		await userEvent.click(screen.getByRole("option", { name: "France" }));

		expect(onSelect).toHaveBeenCalledExactlyOnceWith("france");
	});

	it("shows the group heading above its items", () => {
		renderPalette();

		expect(screen.getByText("Countries")).toBeDefined();
	});

	it("marks every part with its slot, the input's wrapper included", () => {
		const { container } = renderPalette();

		for (const name of [
			"command",
			"command-input-wrapper",
			"command-input",
			"command-list",
			"command-group",
			"command-item",
		]) {
			expect(container.querySelector(`[data-slot="${name}"]`)).not.toBeNull();
		}
	});
});
