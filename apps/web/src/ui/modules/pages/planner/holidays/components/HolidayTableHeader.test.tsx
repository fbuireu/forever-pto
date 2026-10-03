import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { HolidayDTO } from "@application/dto/holiday/types";
import en from "@i18n/messages/en.json";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { HolidayTableHeader } from "./HolidayTableHeader";

const renderHeader = (onSort: (key: keyof HolidayDTO) => void) =>
	render(
		<NextIntlClientProvider locale="en" messages={en}>
			<table>
				<HolidayTableHeader selectAllButton={null} sortConfig={{ key: "date", direction: "asc" }} onSort={onSort} />
			</table>
		</NextIntlClientProvider>,
	);

describe("HolidayTableHeader", () => {
	it("declares itself a client module, since its header buttons carry click handlers", () => {
		const source = readFileSync(join(__dirname, "HolidayTableHeader.tsx"), "utf8");

		expect(source.startsWith('"use client";')).toBe(true);
	});

	it("sorts by the column whose header is pressed", () => {
		const onSort = vi.fn();
		renderHeader(onSort);

		fireEvent.click(screen.getByRole("button", { name: en.holidayTableHeader.holiday }));

		expect(onSort).toHaveBeenCalledExactlyOnceWith("name");
	});
});
