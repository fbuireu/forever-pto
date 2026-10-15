import { createContext, type ReactElement, type ReactNode, use } from "react";

interface StrictProviderProps<T> {
	value: T;
	children?: ReactNode;
}

export function getStrictContext<T>(
	name?: string,
): readonly [(props: StrictProviderProps<T>) => ReactElement, () => T] {
	const Context = createContext<T | undefined>(undefined);

	const Provider = ({ value, children }: StrictProviderProps<T>) => <Context value={value}>{children}</Context>;

	const useSafeContext = () => {
		const ctx = use(Context);
		if (ctx === undefined) {
			throw new Error(`useContext must be used within ${name ?? "a Provider"}`);
		}
		return ctx;
	};

	return [Provider, useSafeContext] as const;
}
