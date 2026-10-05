import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { Address } from "./Address";
import { Me } from "./Me";
import { Nif } from "./Nif";
import { decodeScrambledText } from "./ScrambledText";

const NBSP = "\u00A0";
const OWNER = `Ferran${NBSP}Buireu`;
const NIF = "46972297H";
const ADDRESS = ["Carrer", "de", "Loreto", "36,", "5B,", "08029,", "Barcelona,", "Spain"].join(NBSP);

const identity = (element: ReactElement) => render(element).getByRole("img");

describe("legal identity", () => {
	it("announces the owner rather than the field label", () => {
		expect(identity(<Me />).getAttribute("aria-label")).toBe(OWNER);
	});

	it("announces the NIF rather than the field label", () => {
		expect(identity(<Nif />).getAttribute("aria-label")).toBe(NIF);
	});

	it("announces the registered address rather than the field label", () => {
		expect(identity(<Address />).getAttribute("aria-label")).toBe(ADDRESS);
	});

	it("paints the characters scrambled, so only the accessible name carries the identity", () => {
		expect(identity(<Nif />).textContent).not.toBe(NIF);
	});

	it("decodes a table by order rather than by source position", () => {
		expect(
			decodeScrambledText([
				{ character: "b", order: 1 },
				{ character: "a", order: 0 },
			]),
		).toBe("ab");
	});
});
