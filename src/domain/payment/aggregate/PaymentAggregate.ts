import { BaseAggregate, type DomainEvent } from '@domain/shared/events/base';
import type { PaymentData } from '../models/types';

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded' | 'disputed';

export interface PaymentDomainEvent extends DomainEvent {
  aggregateType: 'Payment';
}

export interface PaymentCreatedEvent extends PaymentDomainEvent {
  type: 'payment_created';
  email: string;
  amount: number;
  currency: string;
}

export interface PaymentStatusChangedEvent extends PaymentDomainEvent {
  type: 'payment_status_changed';
  previousStatus: PaymentStatus;
  newStatus: PaymentStatus;
}

export interface ChargeDetailsUpdatedEvent extends PaymentDomainEvent {
  type: 'charge_details_updated';
  chargeId: string;
}

export type PaymentAggregateEvent =
  | PaymentCreatedEvent
  | PaymentStatusChangedEvent
  | ChargeDetailsUpdatedEvent;

export class PaymentAggregate extends BaseAggregate<PaymentAggregateEvent> {
  private readonly data: PaymentData;

  private constructor(data: PaymentData) {
    super();
    this.data = { ...data };
  }

  static fromData(data: PaymentData): PaymentAggregate {
    return new PaymentAggregate(data);
  }

  static create(data: PaymentData): PaymentAggregate {
    const aggregate = new PaymentAggregate(data);

    aggregate.addDomainEvent({
      type: 'payment_created',
      aggregateId: data.id,
      aggregateType: 'Payment',
      timestamp: new Date(),
      email: data.email,
      amount: data.amount,
      currency: data.currency,
    });

    return aggregate;
  }

  getId(): string {
    return this.data.id;
  }

  getEmail(): string {
    return this.data.email;
  }

  getAmount(): number {
    return this.data.amount;
  }

  getStatus(): PaymentStatus {
    return this.data.status as PaymentStatus;
  }

  getData(): Readonly<PaymentData> {
    return { ...this.data };
  }

  markAsSucceeded(): void {
    const previousStatus = this.data.status as PaymentStatus;

    if (previousStatus === 'succeeded') {
      return;
    }

    this.data.status = 'succeeded';

    this.addDomainEvent({
      type: 'payment_status_changed',
      aggregateId: this.data.id,
      aggregateType: 'Payment',
      timestamp: new Date(),
      previousStatus,
      newStatus: 'succeeded',
    });
  }

  markAsFailed(): void {
    const previousStatus = this.data.status as PaymentStatus;

    if (previousStatus === 'failed') {
      return;
    }

    this.data.status = 'failed';

    this.addDomainEvent({
      type: 'payment_status_changed',
      aggregateId: this.data.id,
      aggregateType: 'Payment',
      timestamp: new Date(),
      previousStatus,
      newStatus: 'failed',
    });
  }

  updateChargeDetails(chargeId: string, details: Partial<PaymentData>): void {
    this.data.chargeId = chargeId;

    if (details.country !== undefined) this.data.country = details.country;
    if (details.customerName !== undefined) this.data.customerName = details.customerName;
    if (details.postalCode !== undefined) this.data.postalCode = details.postalCode;
    if (details.city !== undefined) this.data.city = details.city;
    if (details.state !== undefined) this.data.state = details.state;
    if (details.paymentBrand !== undefined) this.data.paymentBrand = details.paymentBrand;
    if (details.paymentLast4 !== undefined) this.data.paymentLast4 = details.paymentLast4;
    if (details.feeAmount !== undefined) this.data.feeAmount = details.feeAmount;
    if (details.netAmount !== undefined) this.data.netAmount = details.netAmount;

    this.addDomainEvent({
      type: 'charge_details_updated',
      aggregateId: this.data.id,
      aggregateType: 'Payment',
      timestamp: new Date(),
      chargeId,
    });
  }

  canBeRefunded(): boolean {
    return this.data.status === 'succeeded' && this.data.refundedAt === null;
  }

  isSucceeded(): boolean {
    return this.data.status === 'succeeded';
  }
}
