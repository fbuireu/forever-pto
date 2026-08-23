import { type ScrambledChar, ScrambledText } from "@ui/modules/pages/legal/ScrambledText";

const CHARS: readonly ScrambledChar[] = [
	{ character: "2", order: 4 },
	{ character: "4", order: 0 },
	{ character: "7", order: 7 },
	{ character: "9", order: 2 },
	{ character: "9", order: 6 },
	{ character: "6", order: 1 },
	{ character: "H", order: 8 },
	{ character: "7", order: 3 },
	{ character: "2", order: 5 },
];

export const Nif = () => <ScrambledText chars={CHARS} />;
