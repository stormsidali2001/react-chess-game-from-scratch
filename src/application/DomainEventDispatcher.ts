import mitt, { Emitter } from 'mitt';
import { IDomainEvent } from '../domain/core/BaseAggregateRoot';

// Define the shape of our events for mitt's type safety
type DomainEvents = {
  [key: string]: IDomainEvent;
};

export class DomainEventDispatcher {
  private emitter: Emitter<DomainEvents>;

  constructor() {
    this.emitter = mitt<DomainEvents>();
  }

  /**
   * Register a handler for a specific event type by its class name
   */
  public register<T extends IDomainEvent>(
    eventClass: { new (...args: any[]): T },
    handler: (event: T) => void
  ): void {
    this.emitter.on(eventClass.name, handler as any);
  }

  /**
   * Dispatch a single domain event
   */
  public dispatch(event: IDomainEvent): void {
    const eventName = event.constructor.name;
    this.emitter.emit(eventName, event);
  }

  /**
   * Dispatch multiple domain events
   */
  public dispatchMany(events: IDomainEvent[]): void {
    events.forEach((event) => this.dispatch(event));
  }

  /**
   * Unregister a handler
   */
  public unregister<T extends IDomainEvent>(
    eventClass: { new (...args: any[]): T },
    handler: (event: T) => void
  ): void {
    this.emitter.off(eventClass.name, handler as any);
  }
}

// Global instance for the application layer
export const domainEventDispatcher = new DomainEventDispatcher();
