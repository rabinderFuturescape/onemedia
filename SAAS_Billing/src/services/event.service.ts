/**
 * Event Service
 * 
 * This service provides methods to track usage events in the Lago billing system.
 */

import { LagoApiService } from './lago-api.service';
import { 
  Event, 
  EventCreateInput, 
  EventBatchInput,
  EventResponse,
  EventBatchResponse
} from '../models/event.model';

export class EventService {
  private apiService: LagoApiService;

  /**
   * Create a new event service instance
   * 
   * @param apiService - The Lago API service
   */
  constructor(apiService: LagoApiService) {
    this.apiService = apiService;
  }

  /**
   * Create a new event
   * 
   * @param event - The event data
   * @returns The event response
   */
  public async createEvent(event: EventCreateInput): Promise<EventResponse> {
    return this.apiService.post<EventResponse>('/events', {
      event,
    });
  }

  /**
   * Create multiple events in a batch
   * 
   * @param events - The events data
   * @returns The batch response
   */
  public async createEvents(events: EventBatchInput): Promise<EventBatchResponse> {
    return this.apiService.post<EventBatchResponse>('/events/batch', events);
  }

  /**
   * Track a usage event
   * 
   * This is a convenience method that generates a transaction ID and handles errors
   * 
   * @param customerId - The customer ID
   * @param code - The billable metric code
   * @param properties - The event properties
   * @param subscriptionId - Optional subscription ID
   * @returns True if the event was tracked successfully
   */
  public async trackUsage(
    customerId: string,
    code: string,
    properties: Record<string, any> = {},
    subscriptionId?: string
  ): Promise<boolean> {
    try {
      // Generate a unique transaction ID
      const transactionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      
      const event: EventCreateInput = {
        transactionId,
        externalCustomerId: customerId,
        code,
        timestamp: new Date().toISOString(),
        properties,
      };

      if (subscriptionId) {
        event.externalSubscriptionId = subscriptionId;
      }

      const response = await this.createEvent(event);
      return response.event.success;
    } catch (error) {
      console.error('Error tracking usage:', error);
      return false;
    }
  }

  /**
   * Track multiple usage events
   * 
   * This is a convenience method that generates transaction IDs and handles errors
   * 
   * @param events - Array of events to track
   * @returns The number of successfully tracked events
   */
  public async trackBatchUsage(
    events: Array<{
      customerId: string;
      code: string;
      properties?: Record<string, any>;
      subscriptionId?: string;
    }>
  ): Promise<number> {
    try {
      const formattedEvents: Event[] = events.map(event => ({
        transactionId: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
        externalCustomerId: event.customerId,
        code: event.code,
        timestamp: new Date().toISOString(),
        properties: event.properties || {},
        externalSubscriptionId: event.subscriptionId,
      }));

      const response = await this.createEvents({ events: formattedEvents });
      
      if (response.status === 'success') {
        return formattedEvents.length;
      } else if (response.status === 'partial') {
        return response.eventResults.filter(result => result.success).length;
      } else {
        return 0;
      }
    } catch (error) {
      console.error('Error tracking batch usage:', error);
      return 0;
    }
  }
}
