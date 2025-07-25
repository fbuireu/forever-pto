import { getDatabase } from "@infrastructure/client/database";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	const database = getDatabase();
	try {
		const data = await request.json();

		const verificationToken = process.env.KOFI_WEBHOOK_TOKEN;
		if (data.verification_token !== verificationToken) {
			return NextResponse.json({ error: "Invalid token" }, { status: 401 });
		}

		const existingPayment = await database.execute({
			sql: "SELECT * FROM payments WHERE message_id = ?",
			args: [data.message_id],
		});

		if (existingPayment.rows.length > 0) {
			return NextResponse.json({ message: "Payment already processed" });
		}

		await database.execute({
			sql: "INSERT INTO payments (id, email, timestamp, message_id) VALUES (?, ?, ?, ?)",
			args: [crypto.randomUUID(), data.email, new Date(data.timestamp).toISOString(), data.message_id],
		});

		return NextResponse.json({ message: "Payment processed successfully" });
	} catch (_) {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
