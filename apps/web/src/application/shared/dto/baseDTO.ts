export type BaseDTO<INPUT, OUTPUT, PARAMS = undefined> = [PARAMS] extends [undefined]
	? { create: (args: { raw: INPUT }) => OUTPUT }
	: { create: (args: { raw: INPUT; params: PARAMS }) => OUTPUT };
