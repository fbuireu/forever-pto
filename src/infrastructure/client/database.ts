import { type Client, createClient } from "@libsql/client";

let database: Client | undefined;

export function getDatabase() {
	if (database) return database;

	const url = process.env.TURSO_DATABASE_URL;
	const authToken = process.env.TURSO_AUTH_TOKEN;

	if (!url) {
		throw new Error("Missing TURSO_DATABASE_URL");
	}

	if (!authToken) {
		throw new Error("Missing TURSO_AUTH_TOKEN");
	}

	database = createClient({
		url,
		authToken,
	});

	return database;
}
