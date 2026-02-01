export interface DomainEvent {
  type: string;
  aggregateId: string;
  aggregateType: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface AggregateRoot<TEvent extends DomainEvent = DomainEvent> {
  getId(): string;
  getDomainEvents(): TEvent[];
  clearDomainEvents(): void;
}

export abstract class BaseAggregate<TEvent extends DomainEvent = DomainEvent>
  implements AggregateRoot<TEvent>
{
  protected domainEvents: TEvent[] = [];

  abstract getId(): string;

  getDomainEvents(): TEvent[] {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }

  protected addDomainEvent(event: TEvent): void {
    this.domainEvents.push(event);
  }
}
