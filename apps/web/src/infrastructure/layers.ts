import { TursoServiceLive } from "@infrastructure/clients/db/turso/service";
import { ResendServiceLive } from "@infrastructure/clients/email/resend/service";
import { StripeServerServiceLive } from "@infrastructure/clients/payments/stripe/serverService";
import { LoggerServiceLive } from "@infrastructure/logging/service";
import { Layer } from "effect";

export const ApplicationLayer = Layer.mergeAll(
	TursoServiceLive,
	StripeServerServiceLive,
	ResendServiceLive,
	LoggerServiceLive,
);
