/**
 * Subscription Service
 * 
 * This service provides methods to manage subscriptions in the Lago billing system.
 */

import { LagoApiService } from './lago-api.service';
import { 
  Subscription, 
  SubscriptionCreateInput, 
  SubscriptionUpdateInput,
  SubscriptionTerminateInput,
  SubscriptionCancelInput,
  SubscriptionResponse, 
  SubscriptionsResponse 
} from '../models/subscription.model';

export class SubscriptionService {
  private apiService: LagoApiService;

  /**
   * Create a new subscription service instance
   * 
   * @param apiService - The Lago API service
   */
  constructor(apiService: LagoApiService) {
    this.apiService = apiService;
  }

  /**
   * Create a new subscription
   * 
   * @param subscription - The subscription data
   * @returns The created subscription
   */
  public async createSubscription(subscription: SubscriptionCreateInput): Promise<Subscription> {
    const response = await this.apiService.post<SubscriptionResponse>('/subscriptions', {
      subscription,
    });
    return response.subscription;
  }

  /**
   * Get a subscription by ID
   * 
   * @param subscriptionId - The subscription ID
   * @returns The subscription
   */
  public async getSubscription(subscriptionId: string): Promise<Subscription> {
    const response = await this.apiService.get<SubscriptionResponse>(`/subscriptions/${subscriptionId}`);
    return response.subscription;
  }

  /**
   * Update a subscription
   * 
   * @param subscription - The subscription data to update
   * @returns The updated subscription
   */
  public async updateSubscription(subscription: SubscriptionUpdateInput): Promise<Subscription> {
    const { subscriptionId, ...subscriptionData } = subscription;
    const response = await this.apiService.put<SubscriptionResponse>(`/subscriptions/${subscriptionId}`, {
      subscription: subscriptionData,
    });
    return response.subscription;
  }

  /**
   * Terminate a subscription
   * 
   * @param subscription - The subscription data to terminate
   * @returns The terminated subscription
   */
  public async terminateSubscription(subscription: SubscriptionTerminateInput): Promise<Subscription> {
    const { subscriptionId } = subscription;
    const response = await this.apiService.put<SubscriptionResponse>(`/subscriptions/${subscriptionId}`, {
      subscription: {
        status: 'terminated',
      },
    });
    return response.subscription;
  }

  /**
   * Cancel a subscription
   * 
   * @param subscription - The subscription data to cancel
   * @returns The canceled subscription
   */
  public async cancelSubscription(subscription: SubscriptionCancelInput): Promise<Subscription> {
    const { subscriptionId } = subscription;
    const response = await this.apiService.put<SubscriptionResponse>(`/subscriptions/${subscriptionId}`, {
      subscription: {
        status: 'canceled',
      },
    });
    return response.subscription;
  }

  /**
   * Get all subscriptions
   * 
   * @param page - The page number
   * @param perPage - The number of items per page
   * @param customerId - Optional customer ID to filter by
   * @param planId - Optional plan ID to filter by
   * @param status - Optional status to filter by
   * @returns The subscriptions
   */
  public async getSubscriptions(
    page: number = 1, 
    perPage: number = 20,
    customerId?: string,
    planId?: string,
    status?: string
  ): Promise<SubscriptionsResponse> {
    const params: Record<string, any> = {
      page,
      per_page: perPage,
    };

    if (customerId) {
      params.customer_id = customerId;
    }

    if (planId) {
      params.plan_id = planId;
    }

    if (status) {
      params.status = status;
    }

    return this.apiService.get<SubscriptionsResponse>('/subscriptions', params);
  }

  /**
   * Get all subscriptions for a customer
   * 
   * @param customerId - The customer ID
   * @param page - The page number
   * @param perPage - The number of items per page
   * @returns The customer's subscriptions
   */
  public async getCustomerSubscriptions(
    customerId: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<SubscriptionsResponse> {
    return this.getSubscriptions(page, perPage, customerId);
  }

  /**
   * Get all active subscriptions for a customer
   * 
   * @param customerId - The customer ID
   * @param page - The page number
   * @param perPage - The number of items per page
   * @returns The customer's active subscriptions
   */
  public async getActiveCustomerSubscriptions(
    customerId: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<SubscriptionsResponse> {
    return this.getSubscriptions(page, perPage, customerId, undefined, 'active');
  }

  /**
   * Check if a customer has an active subscription to a plan
   * 
   * @param customerId - The customer ID
   * @param planId - The plan ID
   * @returns True if the customer has an active subscription to the plan
   */
  public async hasActiveSubscription(customerId: string, planId: string): Promise<boolean> {
    try {
      const response = await this.getSubscriptions(1, 1, customerId, planId, 'active');
      return response.subscriptions.length > 0;
    } catch (error) {
      console.error('Error checking active subscription:', error);
      return false;
    }
  }
}
