import { logClientError } from "@application/shared/utils/clientLog";
import { createJSONStorage, type PersistStorage, type StateStorage } from "zustand/middleware";
import { onRehydrateFailure } from "./rehydration";
import { deobfuscate, obfuscate } from "./utils/crypto";

const SECRET_KEY = process.env.NEXT_PUBLIC_STORAGE_KEY;
const isDev = process.env.NODE_ENV === "development";
const isClient = globalThis.window !== undefined;

const textStorage = (): StateStorage => {
	if (!isClient) {
		return {
			getItem: () => null,
			setItem: () => {},
			removeItem: () => {},
		};
	}

	if (isDev || !SECRET_KEY) {
		return {
			getItem: (key: string) => localStorage.getItem(key),
			setItem: (key: string, value: string) => {
				if (localStorage.getItem(key) === value) return;
				localStorage.setItem(key, value);
			},
			removeItem: (key: string) => localStorage.removeItem(key),
		};
	}

	const obfuscationKey = SECRET_KEY;
	const written = new Map<string, { value: string; stored: string }>();

	return {
		getItem: (key: string) => {
			const obfuscatedValue = localStorage.getItem(key);
			if (!obfuscatedValue) return null;

			try {
				const value = deobfuscate({ text: obfuscatedValue, key: obfuscationKey });
				written.set(key, { value, stored: obfuscatedValue });
				return value;
			} catch (error) {
				logClientError({ message: "Failed to deobfuscate storage value", error, context: { key } });
				return null;
			}
		},
		setItem: (key: string, value: string) => {
			const last = written.get(key);
			if (last?.value === value && localStorage.getItem(key) === last.stored) return;

			try {
				const stored = obfuscate({ text: value, key: obfuscationKey });
				localStorage.setItem(key, stored);
				written.set(key, { value, stored });
			} catch (error) {
				logClientError({ message: "Failed to set item in obfuscated storage", error, context: { key } });
			}
		},
		removeItem: (key: string) => {
			written.delete(key);
			try {
				localStorage.removeItem(key);
			} catch (error) {
				logClientError({ message: "Failed to remove item from obfuscated storage", error, context: { key } });
			}
		},
	};
};

const jsonStorage = createJSONStorage(textStorage);

export const obfuscatedStorage: PersistStorage<unknown> | undefined = jsonStorage && {
	...jsonStorage,
	getItem: (name) => {
		try {
			return jsonStorage.getItem(name);
		} catch (error) {
			onRehydrateFailure({ storeName: name, error, state: undefined });
			return null;
		}
	},
};
