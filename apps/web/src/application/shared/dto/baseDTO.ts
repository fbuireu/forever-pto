export type BaseDTO<INPUT, OUTPUT, PARAMS = unknown> = {
  create: (params: { raw: INPUT; params?: PARAMS }) => OUTPUT;
};
