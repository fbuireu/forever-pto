export type BaseDTO<INPUT, OUTPUT, CONFIGURATION = unknown> = {
	create: (params: { raw: INPUT; configuration?: CONFIGURATION }) => OUTPUT;
};
