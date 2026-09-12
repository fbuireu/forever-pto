import { createContext, type ReactNode, use } from "react";

export function getStrictContext<T>(name?: string) {
	const Context = createContext<T | undefined>(undefined);

	const Provider = ({ value, children }: { value: T; children?: ReactNode }) => (
		<Context value={value}>{children}</Context>
	);

	const useSafeContext = () => {
		const ctx = use(Context);
		if (ctx === undefined) {
			throw new Error(`useContext must be used within ${name ?? "a Provider"}`);
		}
		return ctx;
	};

	return [Provider, useSafeContext] as const;
}
