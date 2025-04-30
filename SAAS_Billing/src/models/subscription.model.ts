/**
 * Subscription Model
 * 
 * Represents a subscription in the Lago billing system.
 * Subscriptions connect customers to plans and define the billing relationship.
 */

export type SubscriptionStatus = 'active' | 'pending' | 'terminated' | 'canceled';

export interface SubscriptionMetadata {
  [key: string]: string | number | boolean;
}

export interface Subscription {
  id?: string;
  externalId?: string;
  customerId: string;
  planId: string;
  status?: SubscriptionStatus;
  name?: string;
  externalCustomerId?: string;
  startedAt?: string;
  endingAt?: string;
  subscriptionAt?: string;
  terminatedAt?: string;
  canceledAt?: string;
  createdAt?: string;
  updatedAt?: string;
  nextPendingStartDate?: string;
  previousPlanId?: string;
  metadata?: SubscriptionMetadata;
}

export interface SubscriptionCreateInput {
  customerId: string;
  planId: string;
  name?: string;
  externalId?: string;
  subscriptionDate?: string;
  billingTime?: 'calendar' | 'anniversary';
  endingAt?: string;
  metadata?: SubscriptionMetadata;
}

export interface SubscriptionUpdateInput {
  subscriptionId: string;
  name?: string;
  planId?: string;
  endingAt?: string;
  metadata?: SubscriptionMetadata;
}

export interface SubscriptionTerminateInput {
  subscriptionId: string;
  status?: 'terminated';
}

export interface SubscriptionCancelInput {
  subscriptionId: string;
  status?: 'canceled';
}

export interface SubscriptionResponse {
  subscription: Subscription;
}

export interface SubscriptionsResponse {
  subscriptions: Subscription[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
}
