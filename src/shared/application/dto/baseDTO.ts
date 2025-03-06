export type BaseDTO<INPUT, OUTPUT, CONFIGURATION = undefined> = {
  create: (params: { raw: INPUT; configuration?: CONFIGURATION }) => OUTPUT;
};