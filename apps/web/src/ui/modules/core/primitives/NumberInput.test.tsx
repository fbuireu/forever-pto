import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InputGroup, InputGroupInput } from "./InputGroup";
import { NumberInput, type NumberInputProps } from "./NumberInput";

const ROLE_DESCRIPTION = "Number field";

type ControlledProps = Partial<Omit<NumberInputProps, "value" | "onValueChange">> & {
	initial?: number | null;
	onValueChange?: (value: number | null) => void;
};

const Controlled = ({ initial = null, onValueChange, ...props }: ControlledProps) => {
	const [value, setValue] = useState<number | null>(initial);

	return (
		<>
			<NumberInput
				aria-label="amount"
				locale="en"
				roleDescription={ROLE_DESCRIPTION}
				maximumFractionDigits={2}
				{...props}
				value={value}
				onValueChange={(next) => {
					setValue(next);
					onValueChange?.(next);
				}}
			/>
			<output data-testid="value">{JSON.stringify(value)}</output>
			<button type="button" onClick={() => setValue(10)}>
				ten
			</button>
		</>
	);
};

const field = () => screen.getByRole<HTMLInputElement>("textbox", { name: "amount" });
const held = () => screen.getByTestId("value").textContent;

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
	expect(consoleError).not.toHaveBeenCalled();
	consoleError.mockRestore();
});

describe("NumberInput as an element", () => {
	it("is one text field, the only control the accessibility tree holds, and no spin button", () => {
		render(<Controlled initial={5} />);

		expect(screen.getAllByRole("textbox")).toHaveLength(1);
		expect(screen.queryByRole("spinbutton")).toBeNull();
		expect(field().getAttribute("type")).toBe("text");
	});

	it("says in the words it was given that the text field holds a number", () => {
		render(<Controlled initial={5} roleDescription="Campo numérico" />);

		expect(field().getAttribute("aria-roledescription")).toBe("Campo numérico");
	});

	it("passes the id, the description, the validity and the rest to the input itself", () => {
		render(
			<>
				<span id="note">a note</span>
				<Controlled
					initial={5}
					id="amount-field"
					aria-describedby="note"
					aria-invalid
					placeholder="Enter amount"
					name="amount"
					inputMode="decimal"
					autoComplete="off"
					className="pl-2"
					data-slot="form-control"
				/>
			</>,
		);

		expect(field().id).toBe("amount-field");
		expect(field().getAttribute("aria-describedby")).toBe("note");
		expect(field().getAttribute("aria-invalid")).toBe("true");
		expect(field().getAttribute("placeholder")).toBe("Enter amount");
		expect(field().getAttribute("name")).toBe("amount");
		expect(field().getAttribute("inputmode")).toBe("decimal");
		expect(field().getAttribute("autocomplete")).toBe("off");
		expect(field().getAttribute("data-slot")).toBe("form-control");
		expect(field().className).toContain("pl-2");
	});

	it("lets a label point at it by id", () => {
		render(
			<>
				<label htmlFor="amount-field">Donation amount</label>
				<Controlled initial={5} id="amount-field" aria-label={undefined} />
			</>,
		);

		expect(screen.getByLabelText("Donation amount")).toBe(screen.getByRole("textbox"));
	});

	it("draws the app's Input, and the group's input when it is told to", () => {
		const { rerender } = render(<Controlled initial={5} />);
		expect(field().getAttribute("data-slot")).toBe("input");
		expect(field().className).toContain("h-11");

		rerender(
			<InputGroup>
				<Controlled initial={5} render={<InputGroupInput />} />
			</InputGroup>,
		);
		expect(field().getAttribute("data-slot")).toBe("input-group-control");
		expect(field().className).toContain("border-0");
	});

	it("adds no step buttons", () => {
		render(<Controlled initial={5} />);

		expect(screen.queryAllByRole("button", { name: /increase|decrease|increment|decrement/i })).toEqual([]);
		expect(screen.getAllByRole("button")).toHaveLength(1);
	});

	it("hands the ref to the input", () => {
		const ref = { current: null as HTMLInputElement | null };

		render(<Controlled initial={5} ref={ref} />);

		expect(ref.current).toBe(field());
	});

	it("takes disabled and required to the input", () => {
		render(<Controlled initial={5} disabled required />);

		expect(field().hasAttribute("disabled")).toBe(true);
		expect(field().hasAttribute("required")).toBe(true);
	});

	it("keeps the wrapper out of the layout, so a flex parent still sees the input", () => {
		render(<Controlled initial={5} />);

		expect(field().parentElement?.className).toContain("contents");
	});

	it("survives a locale Intl cannot format", () => {
		render(<Controlled initial={1234.5} locale="not a locale" />);

		expect(field().value).toBe("1,234.5");
	});
});

describe("NumberInput showing a number", () => {
	it.each([
		["en", 1234.5, "1,234.5"],
		["es", 1234.5, "1234,5"],
		["es", 12_345.5, "12.345,5"],
		["de", 1234.5, "1.234,5"],
		["de", 12_345.5, "12.345,5"],
		["fr", 12_345.5, "12 345,5"],
		["en", 0, "0"],
		["en", 5, "5"],
	])("writes %s %d as %j", (locale, value, text) => {
		render(<Controlled initial={value} locale={locale} />);

		expect(field().value).toBe(text);
	});

	it("shows an empty field for none", () => {
		render(<Controlled initial={null} />);

		expect(field().value).toBe("");
	});

	it("follows the value when its owner changes it, as a quick amount does", async () => {
		const user = userEvent.setup();
		render(<Controlled initial={2.5} locale="es" />);

		await user.click(screen.getByRole("button", { name: "ten" }));

		expect(field().value).toBe("10");
	});

	it("follows the value when its owner changes it while the text is in the middle of an edit", async () => {
		const user = userEvent.setup();
		render(<Controlled initial={null} locale="es" />);

		await user.type(field(), "2,");
		await user.click(screen.getByRole("button", { name: "ten" }));

		expect(field().value).toBe("10");
		expect(held()).toBe("10");
	});

	it("tells its owner nothing while it only shows the value it was given", () => {
		const onValueChange = vi.fn();

		render(<Controlled initial={1234.5} locale="es" onValueChange={onValueChange} />);

		expect(onValueChange).not.toHaveBeenCalled();
	});
});

describe("NumberInput being typed into", () => {
	it.each([
		["en", "2.5", 2.5],
		["en", "30,000", 30_000],
		["es", "2,5", 2.5],
		["es", "30.000", 30_000],
		["de", "2,5", 2.5],
		["de", "30.000", 30_000],
		["fr", "30 000", 30_000],
		["es", "2.5", 2.5],
		["en", "2,5", 2.5],
	])("reads %s %j as %d", async (locale, text, expected) => {
		const user = userEvent.setup();
		render(<Controlled locale={locale} />);

		await user.type(field(), text);

		expect(held()).toBe(String(expected));
		expect(field().value).toBe(text);
	});

	it("keeps what is typed as it is typed, down to a trailing separator, until the field is left", async () => {
		const user = userEvent.setup();
		render(<Controlled locale="es" />);

		await user.type(field(), "4,");
		expect(field().value).toBe("4,");
		expect(held()).toBe("4");

		await user.tab();
		expect(field().value).toBe("4");
		expect(held()).toBe("4");
	});

	it("reports a reading when it changes, and nothing when the text changes without changing the reading", async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		render(<Controlled initial={4} onValueChange={onValueChange} />);

		await user.click(field());
		await user.keyboard("{End}.0");
		expect(onValueChange).not.toHaveBeenCalled();

		await user.keyboard("5");
		expect(onValueChange.mock.calls.map(([value]) => value)).toEqual([4.05]);
	});

	it("keeps an emptied field empty and reports none", async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		render(<Controlled initial={7} onValueChange={onValueChange} />);

		await user.clear(field());

		expect(field().value).toBe("");
		expect(held()).toBe("null");
		expect(onValueChange).toHaveBeenLastCalledWith(null);
	});

	it("turns away a letter before it reaches the text", async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		render(<Controlled initial={7} onValueChange={onValueChange} />);

		await user.click(field());
		await user.keyboard("{End}a");

		expect(field().value).toBe("7");
		expect(onValueChange).not.toHaveBeenCalled();
	});

	it("reports none for text it cannot read, and shows an empty field once it is left", async () => {
		const user = userEvent.setup();
		render(<Controlled initial={7} locale="es" />);

		await user.clear(field());
		await user.type(field(), "1.2.3");
		expect(held()).toBe("null");
		expect(field().value).toBe("1.2.3");

		await user.tab();
		expect(field().value).toBe("");
		expect(held()).toBe("null");
	});

	it("clears a lone separator when the field is left", async () => {
		const user = userEvent.setup();
		render(<Controlled initial={7} locale="en" />);

		await user.clear(field());
		await user.type(field(), ".");
		expect(held()).toBe("null");

		await user.tab();
		expect(field().value).toBe("");
	});

	it("rewrites a number held with the other language's separator in its own once it is left", async () => {
		const user = userEvent.setup();
		render(<Controlled locale="es" />);

		await user.type(field(), "2.50");
		expect(held()).toBe("2.5");
		await user.tab();

		expect(field().value).toBe("2,5");
		expect(held()).toBe("2.5");
	});

	it("rounds to the fraction digits it was given once it is left, and holds the rounded number", async () => {
		const user = userEvent.setup();
		render(<Controlled locale="en" maximumFractionDigits={2} />);

		await user.type(field(), "2.555");
		expect(held()).toBe("2.555");
		await user.tab();

		expect(field().value).toBe("2.56");
		expect(held()).toBe("2.56");
	});

	it("does not clamp what is typed past its bounds", async () => {
		const user = userEvent.setup();
		render(<Controlled min={1} max={100} />);

		await user.type(field(), "250");
		await user.tab();

		expect(held()).toBe("250");
		expect(field().value).toBe("250");
	});

	it("lets a minus sign be typed, as a number input does, and reads the negative number it makes", async () => {
		const user = userEvent.setup();
		render(<Controlled min={0} />);

		await user.type(field(), "-5");

		expect(field().value).toBe("-5");
		expect(held()).toBe("-5");
	});

	it("takes a pasted number in the other language's separator too", async () => {
		const user = userEvent.setup();
		render(<Controlled locale="es" />);

		await user.click(field());
		await user.paste("2.5");
		expect(held()).toBe("2.5");
		await user.tab();

		expect(field().value).toBe("2,5");
	});

	it("takes a pasted grouped number", async () => {
		const user = userEvent.setup();
		render(<Controlled locale="de" />);

		await user.click(field());
		await user.paste("12.345,5");

		expect(held()).toBe("12345.5");
	});
});

describe("NumberInput's keyboard", () => {
	it("steps by the step, from the number typed, and snaps to the step's grid", async () => {
		const user = userEvent.setup();
		render(<Controlled initial={2.5} step={1} min={1} />);

		await user.click(field());
		await user.keyboard("{ArrowUp}");
		expect(field().value).toBe("3");
		expect(held()).toBe("3");

		await user.keyboard("{ArrowDown}{ArrowDown}");
		expect(field().value).toBe("1");
	});

	it("steps from a number typed, before the field is left", async () => {
		const user = userEvent.setup();
		render(<Controlled locale="es" step={1} min={1} />);

		await user.type(field(), "7,5");
		await user.keyboard("{ArrowUp}");

		expect(field().value).toBe("8");
		expect(held()).toBe("8");
	});

	it("goes to its bounds with Home and End, and stops there", async () => {
		const user = userEvent.setup();
		render(<Controlled initial={5} min={1} max={9} />);

		await user.click(field());
		await user.keyboard("{End}");
		expect(held()).toBe("9");
		await user.keyboard("{ArrowUp}");
		expect(held()).toBe("9");

		await user.keyboard("{Home}");
		expect(held()).toBe("1");
		await user.keyboard("{ArrowDown}");
		expect(held()).toBe("1");
	});

	it("starts from the lower bound when an empty field is stepped", async () => {
		const user = userEvent.setup();
		render(<Controlled initial={null} min={3} />);

		await user.click(field());
		await user.keyboard("{ArrowUp}");

		expect(held()).toBe("3");
	});

	it("does nothing to a disabled field", async () => {
		const user = userEvent.setup();
		render(<Controlled initial={5} disabled />);

		fireEvent.keyDown(field(), { key: "ArrowUp" });
		await user.keyboard("{ArrowUp}");

		expect(held()).toBe("5");
	});
});

describe("NumberInput on the server and in the browser", () => {
	it.each(["en", "es", "de", "fr"])("hydrates %s without a mismatch", async (locale) => {
		const element = <Controlled initial={1234.5} locale={locale} />;
		const container = document.createElement("div");
		document.body.append(container);
		container.innerHTML = renderToString(element);
		const serverText = container.querySelector<HTMLInputElement>("input[type=text]")?.getAttribute("value");

		await act(async () => {
			hydrateRoot(container, element);
		});

		expect(container.querySelector<HTMLInputElement>("input[type=text]")?.value).toBe(serverText);
		container.remove();
	});
});
