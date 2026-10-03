export interface MatchesClientSecretParams {
	expected: string | null;
	provided: string;
}

export function matchesClientSecret({ expected, provided }: MatchesClientSecretParams): boolean {
	if (!expected || expected.length !== provided.length) return false;

	let difference = 0;
	for (let index = 0; index < expected.length; index++) {
		difference |= expected.charCodeAt(index) ^ provided.charCodeAt(index);
	}

	return difference === 0;
}
