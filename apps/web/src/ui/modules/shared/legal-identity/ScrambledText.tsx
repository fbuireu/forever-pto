export interface ScrambledChar {
	character: string;
	order: number;
}

export const decodeScrambledText = (chars: readonly ScrambledChar[]): string =>
	[...chars]
		.sort((first, second) => first.order - second.order)
		.map(({ character }) => character)
		.join("");

interface ScrambledTextProps {
	chars: readonly ScrambledChar[];
}

export const ScrambledText = ({ chars }: ScrambledTextProps) => (
	<span className="inline-flex select-none" role="img" aria-label={decodeScrambledText(chars)}>
		{chars.map(({ character, order }) => (
			<span key={order} style={{ order }}>
				{character}
			</span>
		))}
	</span>
);
