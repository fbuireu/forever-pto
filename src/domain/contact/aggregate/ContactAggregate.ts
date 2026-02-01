import { BaseAggregate, type DomainEvent } from '@domain/shared/events/base';
import type { ContactData } from '../repository/types';

export type ContactStatus = 'pending' | 'sent' | 'failed';

export interface ContactDomainEvent extends DomainEvent {
  aggregateType: 'Contact';
}

export interface ContactCreatedEvent extends ContactDomainEvent {
  type: 'contact_created';
  email: string;
  name: string;
  subject: string;
}

export interface ContactEmailSentDomainEvent extends ContactDomainEvent {
  type: 'contact_email_sent';
  messageId: string;
}

export interface ContactEmailFailedDomainEvent extends ContactDomainEvent {
  type: 'contact_email_failed';
  reason: string;
}

export type ContactAggregateEvent =
  | ContactCreatedEvent
  | ContactEmailSentDomainEvent
  | ContactEmailFailedDomainEvent;

export interface ContactFormInput {
  email: string;
  name: string;
  subject: string;
  message: string;
}

export class ContactAggregate extends BaseAggregate<ContactAggregateEvent> {
  private readonly id: string;
  private readonly email: string;
  private readonly name: string;
  private readonly subject: string;
  private readonly message: string;
  private status: ContactStatus;
  private messageId: string | null;
  private readonly createdAt: Date;

  private constructor(
    id: string,
    email: string,
    name: string,
    subject: string,
    message: string,
    status: ContactStatus = 'pending',
    messageId: string | null = null
  ) {
    super();
    this.id = id;
    this.email = email;
    this.name = name;
    this.subject = subject;
    this.message = message;
    this.status = status;
    this.messageId = messageId;
    this.createdAt = new Date();
  }

  static create(input: ContactFormInput): ContactAggregate {
    const id = crypto.randomUUID();
    const aggregate = new ContactAggregate(
      id,
      input.email,
      input.name,
      input.subject,
      input.message
    );

    aggregate.addDomainEvent({
      type: 'contact_created',
      aggregateId: id,
      aggregateType: 'Contact',
      timestamp: new Date(),
      email: input.email,
      name: input.name,
      subject: input.subject,
    });

    return aggregate;
  }

  getId(): string {
    return this.id;
  }

  getEmail(): string {
    return this.email;
  }

  getStatus(): ContactStatus {
    return this.status;
  }

  getMessageId(): string | null {
    return this.messageId;
  }

  toData(): ContactData {
    return {
      email: this.email,
      name: this.name,
      subject: this.subject,
      message: this.message,
      messageId: this.messageId,
    };
  }

  markAsSent(messageId: string): void {
    if (this.status !== 'pending') {
      return;
    }

    this.status = 'sent';
    this.messageId = messageId;

    this.addDomainEvent({
      type: 'contact_email_sent',
      aggregateId: this.id,
      aggregateType: 'Contact',
      timestamp: new Date(),
      messageId,
    });
  }

  markAsFailed(reason: string): void {
    if (this.status !== 'pending') {
      return;
    }

    this.status = 'failed';

    this.addDomainEvent({
      type: 'contact_email_failed',
      aggregateId: this.id,
      aggregateType: 'Contact',
      timestamp: new Date(),
      reason,
    });
  }

  isPending(): boolean {
    return this.status === 'pending';
  }

  isSent(): boolean {
    return this.status === 'sent';
  }
}
