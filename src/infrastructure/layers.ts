import { TursoServiceLive } from '@infrastructure/clients/db/turso/service';
import { ResendServiceLive } from '@infrastructure/clients/email/resend/service';
import { LoggerServiceLive } from '@infrastructure/clients/logging/better-stack/service';
import { StripeServerServiceLive } from '@infrastructure/clients/payments/stripe/server-service';
import { Layer } from 'effect';

export const AppLayer = Layer.mergeAll(TursoServiceLive, StripeServerServiceLive, ResendServiceLive, LoggerServiceLive);
