import { BaseAggregate, type DomainEvent } from '@domain/shared/events/base';

export type SessionStatus = 'active' | 'expired' | 'revoked';

export interface SessionDomainEvent extends DomainEvent {
  aggregateType: 'Session';
}

export interface SessionCreatedDomainEvent extends SessionDomainEvent {
  type: 'session_created';
  email: string;
  paymentIntentId: string;
  expiresAt: Date;
}

export interface SessionVerifiedDomainEvent extends SessionDomainEvent {
  type: 'session_verified';
  email: string;
}

export interface SessionExpiredDomainEvent extends SessionDomainEvent {
  type: 'session_expired';
}

export interface SessionRevokedDomainEvent extends SessionDomainEvent {
  type: 'session_revoked';
  reason: string;
}

export type SessionAggregateEvent =
  | SessionCreatedDomainEvent
  | SessionVerifiedDomainEvent
  | SessionExpiredDomainEvent
  | SessionRevokedDomainEvent;

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export class SessionAggregate extends BaseAggregate<SessionAggregateEvent> {
  private readonly token: string;
  private readonly email: string;
  private readonly paymentIntentId: string;
  private readonly createdAt: Date;
  private readonly expiresAt: Date;
  private status: SessionStatus;

  private constructor(
    token: string,
    email: string,
    paymentIntentId: string,
    createdAt: Date,
    expiresAt: Date,
    status: SessionStatus = 'active'
  ) {
    super();
    this.token = token;
    this.email = email;
    this.paymentIntentId = paymentIntentId;
    this.createdAt = createdAt;
    this.expiresAt = expiresAt;
    this.status = status;
  }

  static create(token: string, email: string, paymentIntentId: string): SessionAggregate {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + THIRTY_DAYS_MS);

    const aggregate = new SessionAggregate(
      token,
      email,
      paymentIntentId,
      now,
      expiresAt,
      'active'
    );

    aggregate.addDomainEvent({
      type: 'session_created',
      aggregateId: token,
      aggregateType: 'Session',
      timestamp: now,
      email,
      paymentIntentId,
      expiresAt,
    });

    return aggregate;
  }

  static fromExisting(
    token: string,
    email: string,
    paymentIntentId: string,
    createdAt: Date,
    expiresAt: Date,
    status: SessionStatus
  ): SessionAggregate {
    return new SessionAggregate(token, email, paymentIntentId, createdAt, expiresAt, status);
  }

  getId(): string {
    return this.token;
  }

  getToken(): string {
    return this.token;
  }

  getEmail(): string {
    return this.email;
  }

  getPaymentIntentId(): string {
    return this.paymentIntentId;
  }

  getStatus(): SessionStatus {
    return this.status;
  }

  getExpiresAt(): Date {
    return this.expiresAt;
  }

  verify(): boolean {
    if (this.status !== 'active') {
      return false;
    }

    if (this.isExpired()) {
      this.expire();
      return false;
    }

    this.addDomainEvent({
      type: 'session_verified',
      aggregateId: this.token,
      aggregateType: 'Session',
      timestamp: new Date(),
      email: this.email,
    });

    return true;
  }

  expire(): void {
    if (this.status === 'expired') {
      return;
    }

    this.status = 'expired';

    this.addDomainEvent({
      type: 'session_expired',
      aggregateId: this.token,
      aggregateType: 'Session',
      timestamp: new Date(),
    });
  }

  revoke(reason: string): void {
    if (this.status === 'revoked') {
      return;
    }

    this.status = 'revoked';

    this.addDomainEvent({
      type: 'session_revoked',
      aggregateId: this.token,
      aggregateType: 'Session',
      timestamp: new Date(),
      reason,
    });
  }

  isValid(): boolean {
    return this.status === 'active' && !this.isExpired();
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isActive(): boolean {
    return this.status === 'active';
  }
}
