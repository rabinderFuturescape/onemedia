/**
 * Event Model
 * 
 * Represents a usage event in the Lago billing system.
 * Events are used to track usage that will be billed according to the billable metrics.
 */

export interface EventProperties {
  [key: string]: string | number | boolean | null;
}

export interface Event {
  transactionId: string;
  externalCustomerId: string;
  code: string;
  timestamp?: string;
  properties?: EventProperties;
  externalSubscriptionId?: string;
}

export interface EventCreateInput extends Event {}

export interface EventBatchInput {
  events: Event[];
}

export interface EventResponse {
  event: {
    success: boolean;
    code?: string;
    errorMessage?: string;
  };
}

export interface EventBatchResponse {
  status: 'success' | 'partial' | 'failure';
  eventResults: {
    transactionId: string;
    externalCustomerId: string;
    code: string;
    success: boolean;
    errorMessage?: string;
  }[];
}
