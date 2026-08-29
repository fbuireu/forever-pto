import { type ScrambledChar, ScrambledText } from "@ui/modules/pages/legal/ScrambledText";

const CHARS: readonly ScrambledChar[] = [
	{ character: "B", order: 7 },
	{ character: "r", order: 3 },
	{ character: "e", order: 11 },
	{ character: "F", order: 0 },
	{ character: "n", order: 5 },
	{ character: "i", order: 9 },
	{ character: "r", order: 2 },
	{ character: "u", order: 12 },
	{ character: "\u00A0", order: 6 },
	{ character: "e", order: 1 },
	{ character: "u", order: 8 },
	{ character: "a", order: 4 },
	{ character: "r", order: 10 },
];

export const Me = () => <ScrambledText chars={CHARS} />;
