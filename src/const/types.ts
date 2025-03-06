export type CapitalizeKeys<T> = {
  [K in keyof T as Uppercase<K & string>]: T[K] extends object ? CapitalizeKeys<T[K]> : T[K];
};

export type LowercaseKeys<T> = {
  [K in keyof T as Lowercase<K & string>]: T[K] extends object ? LowercaseKeys<T[K]> : T[K];
};

export type Except<T, K extends keyof T> = { [P in keyof T as P extends K ? never : P]: T[P] };
