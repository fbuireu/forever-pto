import type { EmailRenderer } from '@application/interfaces/email-renderer';
import type { CountryService, RegionService } from '@application/interfaces/location-services';
import type { PaymentHelpers, PaymentIntentService, PromoCodeService } from '@application/interfaces/payment-services';
import type { ContactRepository } from '@domain/contact/repository/types';
import type { EmailService } from '@domain/contact/services/email';
import type { PaymentRepository } from '@domain/payment/repository/types';
import type { PaymentValidator } from '@domain/payment/services/validators';
import type { SessionRepository } from '@domain/session/repository/types';
import type { Logger } from '@domain/shared/types';
import type Stripe from 'stripe';

import { getTursoClientInstance, type TursoClient } from '@infrastructure/clients/db/turso/client';
import { getResendClientInstance, type ResendClient } from '@infrastructure/clients/email/resend/client';
import { getBetterStackInstance, type BetterStackClient } from '@infrastructure/clients/logging/better-stack/client';
import { getStripeServerInstance } from '@infrastructure/clients/payments/stripe/client';
import { createContactRepository } from '@infrastructure/services/contact/repository';
import { createCountryService } from '@infrastructure/services/countries/getCountries';
import { createEmailRenderer } from '@infrastructure/services/email/renderer';
import { createPaymentRepository } from '@infrastructure/services/payments/repository';
import { createPaymentIntentService } from '@infrastructure/services/payments/provider/payment-intent';
import { createPromoCodeService } from '@infrastructure/services/payments/provider/promo-code';
import { createPaymentValidator } from '@infrastructure/services/payments/provider/validate-payment-intent';
import { createPaymentHelpers } from '@infrastructure/services/payments/utils/helpers';
import { createSessionRepository } from '@infrastructure/services/premium/repository';
import { createRegionService } from '@infrastructure/services/regions/getRegions';

export interface ApplicationDependencies {
  logger: Logger;
  database: TursoClient;
  emailService: EmailService;
  emailRenderer: EmailRenderer;
  stripeServer: Stripe;
  sessionRepository: SessionRepository;
  paymentRepository: PaymentRepository;
  paymentValidator: PaymentValidator;
  contactRepository: ContactRepository;
  paymentIntentService: PaymentIntentService;
  promoCodeService: PromoCodeService;
  paymentHelpers: PaymentHelpers;
  countryService: CountryService;
  regionService: RegionService;
}

interface CreateDependenciesConfig {
  jwtSecret: string;
}

const createEmailServiceAdapter = (resend: ResendClient): EmailService => ({
  sendEmail: (params) => resend.send(params),
});

export const createDependencies = (config: CreateDependenciesConfig): ApplicationDependencies => {
  const logger: BetterStackClient = getBetterStackInstance();
  const database: TursoClient = getTursoClientInstance();
  const resend: ResendClient = getResendClientInstance();
  const stripeServer: Stripe = getStripeServerInstance();

  return {
    logger,
    database,
    emailService: createEmailServiceAdapter(resend),
    emailRenderer: createEmailRenderer(),
    stripeServer,
    sessionRepository: createSessionRepository({ jwtSecret: config.jwtSecret }),
    paymentRepository: createPaymentRepository(database),
    paymentValidator: createPaymentValidator(stripeServer),
    contactRepository: createContactRepository(database),
    paymentIntentService: createPaymentIntentService(stripeServer),
    promoCodeService: createPromoCodeService(stripeServer, logger),
    paymentHelpers: createPaymentHelpers(),
    countryService: createCountryService(logger),
    regionService: createRegionService(logger),
  };
};

export const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
};

export const createDefaultDependencies = (): ApplicationDependencies => {
  return createDependencies({ jwtSecret: getJWTSecret() });
};
