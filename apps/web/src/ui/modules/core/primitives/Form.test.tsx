import { act, render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./Form";

type Values = { email: string };

interface HarnessProps {
	description?: boolean;
	message?: string;
}

const Harness = ({ description = false, message }: HarnessProps) => {
	const form = useForm<Values>({ defaultValues: { email: "" } });

	return (
		<Form {...form}>
			<FormField
				control={form.control}
				name="email"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Email</FormLabel>
						<FormControl>
							<input {...field} />
						</FormControl>
						{description && <FormDescription>Only for the receipt</FormDescription>}
						<FormMessage>{message}</FormMessage>
					</FormItem>
				)}
			/>
			<button type="button" onClick={() => form.setError("email", { message: "Enter an address" })}>
				fail
			</button>
			<button type="button" onClick={() => form.clearErrors("email")}>
				recover
			</button>
		</Form>
	);
};

const control = () => screen.getByLabelText("Email") as HTMLInputElement;

const press = async (name: string) => {
	await act(async () => {
		screen.getByRole("button", { name }).click();
	});
};

describe("Form", () => {
	it("wires the label to the control by id, so the label names the field", () => {
		render(<Harness />);

		expect(control().tagName).toBe("INPUT");
		expect(control().id).toMatch(/-form-item$/);
	});

	it("describes the control by nothing until a description or an error exists", () => {
		render(<Harness />);

		expect(control().getAttribute("aria-describedby")).toBeNull();
		expect(control().getAttribute("aria-invalid")).toBe("false");
		expect(screen.queryByRole("alert")).toBeNull();
	});

	it("points the control at its description once one is rendered", () => {
		render(<Harness description />);

		expect(control().getAttribute("aria-describedby")).toBe(screen.getByText("Only for the receipt").id);
	});

	it("drops the description id again when the description goes away", () => {
		const { rerender } = render(<Harness description />);

		rerender(<Harness />);

		expect(control().getAttribute("aria-describedby")).toBeNull();
	});

	it("announces a field error and marks the control invalid, described by the message after the description", async () => {
		render(<Harness description />);

		await press("fail");

		const alert = screen.getByRole("alert");
		expect(alert.textContent).toBe("Enter an address");
		expect(control().getAttribute("aria-invalid")).toBe("true");
		expect(control().getAttribute("aria-describedby")?.split(" ")).toEqual([
			screen.getByText("Only for the receipt").id,
			alert.id,
		]);
		expect(screen.getByText("Email").dataset.error).toBe("true");
	});

	it("clears the alert and the invalid mark once the error is cleared", async () => {
		render(<Harness />);
		await press("fail");

		await press("recover");

		expect(screen.queryByRole("alert")).toBeNull();
		expect(control().getAttribute("aria-invalid")).toBe("false");
		expect(screen.getByText("Email").dataset.error).toBe("false");
	});

	it("renders a message the caller passes while there is no error, and lets the error replace it", async () => {
		render(<Harness message="Use the address on the receipt" />);
		expect(screen.getByRole("alert").textContent).toBe("Use the address on the receipt");

		await press("fail");

		expect(screen.getByRole("alert").textContent).toBe("Enter an address");
	});
});
