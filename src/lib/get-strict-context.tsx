import { createContext, useContext, type JSX, type ReactNode } from 'react';

function getStrictContext<T>(
  name?: string
): readonly [({ value, children }: { value: T; children?: ReactNode }) => JSX.Element, () => T] {
  const Context = createContext<T | undefined>(undefined);

  const Provider = ({ value, children }: { value: T; children?: ReactNode }) => (
    <Context.Provider value={value}>{children}</Context.Provider>
  );

  const useSafeContext = () => {
    const ctx = useContext(Context);
    if (ctx === undefined) {
      throw new Error(`useContext must be used within ${name ?? 'a Provider'}`);
    }
    return ctx;
  };

  return [Provider, useSafeContext] as const;
}

export { getStrictContext };
